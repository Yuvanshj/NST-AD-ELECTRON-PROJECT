import express from 'express';
import { Event } from '../models/Event.js';
import { EventRsvp } from '../models/EventRsvp.js';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateTicketQrCode } from '../utils/qrGenerator.js';
import { generateTicketHash } from '../utils/crypto.js';
import { authenticate, authorize, optionalAuthenticate, enforceTenantIsolation } from '../middleware/auth.js';

export const eventsRouter = express.Router();

/**
 * GET /api/events
 * List upcoming events with RSVP status
 */
eventsRouter.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { currentUserId, collegeId, eventType } = req.query;
    const effectiveUserId = req.user?._id || currentUserId;

    const filter = { status: { $ne: 'CANCELLED' } };
    if (collegeId) filter.collegeId = collegeId;
    if (eventType) filter.type = eventType;

    const events = await Event.find(filter)
      .populate('collegeId', 'name code city')
      .populate('creatorId', 'fullName')
      .sort({ date: 1, createdAt: -1 });

    const rsvps = await EventRsvp.find({ status: { $ne: 'CANCELLED' } });

    const formatted = events.map((event) => {
      const userRsvp = effectiveUserId
        ? rsvps.find((r) => r.eventId.toString() === event._id.toString() && r.userId.toString() === effectiveUserId.toString())
        : null;

      const registeredCount = rsvps.filter((r) => r.eventId.toString() === event._id.toString()).length;

      return {
        _id: event._id,
        id: event._id,
        collegeId: event.collegeId,
        collegeName: event.collegeId?.name,
        collegeCode: event.collegeId?.code,
        creatorName: event.creatorId?.fullName,
        title: event.title,
        type: event.type,
        eventType: event.type,
        description: event.description,
        date: event.date,
        startDate: event.date,
        time: event.time,
        venue: event.venue,
        location: event.venue,
        isOnline: event.isOnline,
        meetingLink: event.meetingLink,
        capacity: event.capacity,
        registeredCount,
        attendeeCount: registeredCount,
        ticketPrice: event.ticketPrice,
        bannerUrl: event.bannerUrl,
        status: event.status,
        isRegistered: !!userRsvp,
        userTicket: userRsvp,
      };
    });

    res.json({ success: true, count: formatted.length, events: formatted, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/events
 * Create new event (Admin or authorized alumni organizer)
 */
eventsRouter.post('/', authenticate, authorize('SUPER_ADMIN', 'STATE_DIRECTOR', 'COLLEGE_ADMIN', 'ALUMNI'), async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      venue,
      eventType,
      type,
      capacity = 150,
      startDate,
      date,
      time,
      collegeId,
      ticketPrice = 0,
      isOnline = false,
      meetingLink = '',
      bannerUrl = '',
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }

    const targetCollegeId = collegeId || req.user.collegeId?._id || req.user.collegeId;

    if (!enforceTenantIsolation(req, targetCollegeId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot create an event for another college.',
      });
    }

    const event = await Event.create({
      collegeId: targetCollegeId,
      creatorId: req.user._id,
      title,
      description: description || '',
      venue: venue || location || 'College Campus Auditorium',
      type: eventType || type || 'REUNION',
      capacity: Number(capacity) || 150,
      date: startDate || date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: time || '10:00 AM IST',
      ticketPrice: Number(ticketPrice) || 0,
      isOnline: Boolean(isOnline),
      meetingLink,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
      status: 'PUBLISHED',
      registeredCount: 0,
    });

    await AuditLog.create({
      collegeId: targetCollegeId,
      userId: req.user._id,
      action: 'EVENT_CREATED',
      category: 'EVENT',
      details: { eventId: event._id, title: event.title },
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/events/:id/rsvp and /api/events/rsvp
 * RSVP / Register for event and issue verifiable QR ticket
 */
const handleRsvp = async (req, res) => {
  try {
    const targetEventId = req.params.id || req.body.eventId;
    const effectiveUserId = req.user?._id || req.body.userId;

    if (!targetEventId || !effectiveUserId) {
      return res.status(400).json({ success: false, message: 'Event ID and user ID are required for RSVP.' });
    }

    const event = await Event.findById(targetEventId).populate('collegeId', 'code name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check existing RSVP
    let rsvp = await EventRsvp.findOne({
      eventId: targetEventId,
      userId: effectiveUserId,
      status: { $ne: 'CANCELLED' },
    });

    if (rsvp) {
      const rsvpObj = rsvp.toObject();
      rsvpObj.qrCode = rsvp.qrCodeData;
      rsvpObj.isCheckedIn = rsvp.status === 'CHECKED_IN';
      return res.json({ success: true, rsvp: rsvpObj, message: 'Already registered for this event.' });
    }

    // Capacity verification
    const activeCount = await EventRsvp.countDocuments({ eventId: targetEventId, status: { $ne: 'CANCELLED' } });
    if (event.capacity > 0 && activeCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event has reached full capacity.' });
    }

    const code = event.collegeId?.code || 'GTU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${code}-${new Date().getFullYear()}-${rand}`;
    const verificationHash = generateTicketHash(ticketNumber, effectiveUserId.toString(), targetEventId.toString());

    const qrCodeData = await generateTicketQrCode({
      ticketNumber,
      eventId: targetEventId,
      userId: effectiveUserId,
      verificationHash,
    });

    rsvp = await EventRsvp.create({
      eventId: targetEventId,
      userId: effectiveUserId,
      ticketNumber,
      qrCodeData,
      verificationHash,
      status: 'REGISTERED',
    });

    event.registeredCount = activeCount + 1;
    await event.save();

    await Notification.create({
      userId: effectiveUserId,
      title: 'Event Registration Confirmed!',
      message: `You are confirmed for "${event.title}". QR Ticket Pass: ${ticketNumber}.`,
      type: 'EVENT',
    });

    const rsvpObj = rsvp.toObject();
    rsvpObj.qrCode = rsvp.qrCodeData;
    rsvpObj.isCheckedIn = false;

    res.json({ success: true, rsvp: rsvpObj, message: 'Registration successful! QR Pass issued.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

eventsRouter.post('/rsvp', optionalAuthenticate, handleRsvp);
eventsRouter.post('/:id/rsvp', optionalAuthenticate, handleRsvp);

/**
 * POST /api/events/:id/check-in and /api/events/checkin
 * Verify QR ticket and prevent duplicate check-in
 */
const handleCheckIn = async (req, res) => {
  try {
    const { ticketNumber, ticketNumberOrHash, verificationHash, adminId } = req.body;
    const queryCode = ticketNumber || ticketNumberOrHash;
    const reviewerAdminId = req.user?._id || adminId;

    if (!queryCode && !verificationHash) {
      return res.status(400).json({ success: false, message: 'Ticket code or verification hash is required.' });
    }

    const rsvp = await EventRsvp.findOne({
      $or: [
        { ticketNumber: queryCode },
        { verificationHash: queryCode },
        ...(verificationHash ? [{ verificationHash }] : []),
      ],
    })
      .populate('userId', 'fullName email')
      .populate('eventId', 'title collegeId');

    if (!rsvp) {
      return res.status(404).json({ success: false, message: 'Invalid ticket pass code or verification hash.' });
    }

    // Duplicate check-in prevention
    if (rsvp.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: `Duplicate check-in rejected! Ticket ${rsvp.ticketNumber} for ${rsvp.userId?.fullName} was already checked in at ${new Date(rsvp.checkedInAt).toLocaleTimeString()}.`,
        alreadyCheckedIn: true,
        checkedInAt: rsvp.checkedInAt,
        attendeeName: rsvp.userId?.fullName,
      });
    }

    rsvp.status = 'CHECKED_IN';
    rsvp.checkedInAt = new Date();
    await rsvp.save();

    await AuditLog.create({
      collegeId: rsvp.eventId?.collegeId,
      userId: reviewerAdminId,
      action: 'QR_CHECKED_IN',
      category: 'EVENT',
      details: {
        ticketNumber: rsvp.ticketNumber,
        attendeeUserId: rsvp.userId?._id,
        attendeeName: rsvp.userId?.fullName,
      },
    });

    const rsvpObj = rsvp.toObject();
    rsvpObj.isCheckedIn = true;
    rsvpObj.qrCode = rsvp.qrCodeData;

    res.json({
      success: true,
      rsvp: rsvpObj,
      attendeeName: rsvp.userId?.fullName,
      eventTitle: rsvp.eventId?.title,
      message: `Verified and checked in successfully! Welcome, ${rsvp.userId?.fullName}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

eventsRouter.post('/checkin', optionalAuthenticate, handleCheckIn);
eventsRouter.post('/:id/check-in', optionalAuthenticate, handleCheckIn);

/**
 * GET /api/events/tickets/:userId
 * Get user's active event passes
 */
eventsRouter.get('/tickets/:userId', optionalAuthenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const rsvps = await EventRsvp.find({ userId, status: { $ne: 'CANCELLED' } })
      .populate({
        path: 'eventId',
        populate: { path: 'collegeId', select: 'name code city' },
      })
      .sort({ createdAt: -1 });

    const formatted = rsvps.map((r) => {
      const obj = r.toObject();
      obj.qrCode = r.qrCodeData;
      obj.isCheckedIn = r.status === 'CHECKED_IN';
      return obj;
    });

    res.json({ success: true, count: formatted.length, tickets: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default eventsRouter;
