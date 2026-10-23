import express from 'express';
import { Event } from '../models/Event.js';
import { EventRsvp } from '../models/EventRsvp.js';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateTicketQrCode } from '../utils/qrGenerator.js';

export const eventsRouter = express.Router();

// Get events
eventsRouter.get('/', async (req, res) => {
  try {
    const { currentUserId, collegeId } = req.query;
    const filter = {};
    if (collegeId) filter.collegeId = collegeId;

    const events = await Event.find(filter).populate('collegeId', 'name code').populate('creatorId', 'fullName');
    const rsvps = await EventRsvp.find();

    const formatted = events.map((event) => {
      const userRsvp = currentUserId
        ? rsvps.find((r) => r.eventId.toString() === event._id.toString() && r.userId.toString() === currentUserId && r.status !== 'CANCELLED')
        : null;

      return {
        _id: event._id,
        id: event._id,
        collegeId: event.collegeId,
        collegeName: event.collegeId?.name,
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
        registeredCount: event.registeredCount,
        attendeeCount: event.registeredCount,
        ticketPrice: event.ticketPrice,
        bannerUrl: event.bannerUrl,
        status: event.status,
        isRegistered: !!userRsvp,
        userTicket: userRsvp,
      };
    });

    res.json({ success: true, count: formatted.length, events: formatted, data: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create event
eventsRouter.post('/', async (req, res) => {
  try {
    const { title, description, location, venue, eventType, type, capacity, startDate, date, collegeId, organizerId, creatorId } = req.body;
    const event = await Event.create({
      collegeId: collegeId || null,
      creatorId: organizerId || creatorId || null,
      title,
      description,
      venue: venue || location,
      type: eventType || type || 'REUNION',
      capacity: Number(capacity) || 100,
      date: startDate || date || new Date(),
    });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RSVP handler
const handleRsvp = async (req, res) => {
  try {
    const targetEventId = req.params.id || req.body.eventId;
    const { userId } = req.body;

    const event = await Event.findById(targetEventId).populate('collegeId', 'code');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let rsvp = await EventRsvp.findOne({ eventId: targetEventId, userId, status: { $ne: 'CANCELLED' } });
    if (!rsvp) {
      const code = event.collegeId?.code || 'GTU';
      const rand = Math.floor(1000 + Math.random() * 9000);
      const ticketNumber = `TKT-${code}-${new Date().getFullYear()}-${rand}`;
      const verificationHash = `hash_${ticketNumber}_${userId}_${targetEventId}`;

      const qrCodeData = await generateTicketQrCode({
        ticketNumber,
        eventId: targetEventId,
        userId,
        verificationHash,
      });

      rsvp = await EventRsvp.create({
        eventId: targetEventId,
        userId,
        ticketNumber,
        qrCodeData,
        verificationHash,
        status: 'REGISTERED',
      });

      event.registeredCount += 1;
      await event.save();

      await Notification.create({
        userId,
        title: 'Event Registration Confirmed!',
        message: `You are registered for "${event.title}". QR Ticket Pass generated.`,
        type: 'EVENT',
      });
    }

    const rsvpObj = rsvp.toObject();
    rsvpObj.qrCode = rsvp.qrCodeData;
    rsvpObj.isCheckedIn = rsvp.status === 'CHECKED_IN';

    res.json({ success: true, rsvp: rsvpObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

eventsRouter.post('/rsvp', handleRsvp);
eventsRouter.post('/:id/rsvp', handleRsvp);

// Check-in handler
const handleCheckIn = async (req, res) => {
  try {
    const { ticketNumber, ticketNumberOrHash, adminId } = req.body;
    const queryCode = ticketNumber || ticketNumberOrHash;

    const rsvp = await EventRsvp.findOne({
      $or: [{ ticketNumber: queryCode }, { verificationHash: queryCode }],
    })
      .populate('userId', 'fullName')
      .populate('eventId', 'title collegeId');

    if (!rsvp) {
      return res.status(400).json({ success: false, message: 'Invalid ticket pass code or hash.' });
    }

    rsvp.status = 'CHECKED_IN';
    rsvp.checkedInAt = new Date();
    await rsvp.save();

    await AuditLog.create({
      collegeId: rsvp.eventId?.collegeId,
      userId: adminId,
      action: 'QR_CHECKED_IN',
      category: 'ADMIN',
      details: { ticketNumber: rsvp.ticketNumber, attendeeUserId: rsvp.userId?._id },
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
    res.status(500).json({ message: err.message });
  }
};

eventsRouter.post('/checkin', handleCheckIn);
eventsRouter.post('/:id/check-in', handleCheckIn);

// My Tickets
eventsRouter.get('/tickets/:userId', async (req, res) => {
  try {
    const rsvps = await EventRsvp.find({ userId: req.params.userId, status: { $ne: 'CANCELLED' } })
      .populate('eventId')
      .sort({ createdAt: -1 });

    const formatted = rsvps.map((r) => {
      const obj = r.toObject();
      obj.qrCode = r.qrCodeData;
      obj.isCheckedIn = r.status === 'CHECKED_IN';
      return obj;
    });

    res.json({ success: true, count: formatted.length, tickets: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default eventsRouter;
