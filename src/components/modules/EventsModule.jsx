import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Calendar,
  MapPin,
  Clock,
  QrCode,
  CheckCircle2,
  Users,
  Plus,
  Scan,
  Ticket,
} from 'lucide-react';

export default function EventsModule() {
  const { currentUser, colleges } = useAuth();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | tickets | scanner
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [checkInTicketNumber, setCheckInTicketNumber] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    eventType: 'REUNION',
    isVirtual: false,
    startDate: '',
    capacity: 200,
  });

  useEffect(() => {
    loadEvents();
    if (currentUser?._id) {
      loadTickets();
    }
  }, [currentUser]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.events.getAll();
      if (res.events) {
        setEvents(res.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await api.events.getMyTickets(currentUser._id);
      if (res.tickets) {
        setMyTickets(res.tickets);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      const res = await api.events.rsvp(eventId, currentUser._id);
      setSelectedTicket(res.rsvp);
      await loadEvents();
      await loadTickets();
      setActiveTab('tickets');
    } catch (err) {
      alert('RSVP Notice: ' + err.message);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInTicketNumber.trim()) return;

    try {
      // Find event associated with ticket if known, or test with first event
      const targetEventId = events[0]?._id;
      const res = await api.events.checkIn(targetEventId, checkInTicketNumber.trim(), currentUser._id);
      setCheckInResult({
        success: true,
        message: `Successfully verified and checked in: ${res.rsvp.userId?.name || 'Attendee'}!`,
        rsvp: res.rsvp,
      });
      setCheckInTicketNumber('');
      await loadEvents();
      await loadTickets();
    } catch (err) {
      setCheckInResult({
        success: false,
        message: 'Scan error: ' + err.message,
      });
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.events.create({
        ...eventForm,
        collegeId: currentUser.collegeId?._id || (colleges[0] ? colleges[0]._id : null),
        organizerId: currentUser._id,
        capacity: Number(eventForm.capacity),
      });
      setShowCreateModal(false);
      await loadEvents();
    } catch (err) {
      alert('Error creating event: ' + err.message);
    }
  };

  const isAdmin = currentUser?.role === 'COLLEGE_ADMIN' || currentUser?.role === 'STATE_DIRECTOR';

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar color="#3b82f6" /> Events & QR Ticket Passes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            College convocations, departmental reunions, and tech summits with paperless QR badge check-in.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={16} /> Schedule Campus Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Calendar size={14} /> Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Ticket size={14} /> My Registered Passes ({myTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`btn ${activeTab === 'scanner' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Scan size={14} /> Desk QR Scanner & Check-In
        </button>
      </div>

      {/* Tab: Upcoming Events */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading upcoming events...
            </div>
          ) : events.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No scheduled events found.
            </div>
          ) : (
            events.map((ev) => {
              const dateStr = new Date(ev.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isRegistered = myTickets.some((t) => t.eventId?._id === ev._id);

              return (
                <div key={ev._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="badge badge-primary">{ev.eventType}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.collegeId?.name}</span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ev.title}</h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', minHeight: 40 }}>
                      {ev.description}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} color="#60a5fa" />
                        <span>{dateStr}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} color="#f59e0b" />
                        <span>{ev.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={14} color="#34d399" />
                        <span>{ev.attendeeCount || 0} / {ev.capacity} Confirmed Attendees</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    {isRegistered ? (
                      <button
                        onClick={() => {
                          const ticket = myTickets.find((t) => t.eventId?._id === ev._id);
                          setSelectedTicket(ticket);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', gap: '0.5rem', color: '#34d399' }}
                      >
                        <CheckCircle2 size={16} color="#34d399" /> View QR Event Pass
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRsvp(ev._id)}
                        className="btn btn-primary"
                        style={{ width: '100%', gap: '0.5rem' }}
                      >
                        <QrCode size={16} /> RSVP & Generate QR Pass
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: My Registered Tickets */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {myTickets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              You have not registered for any events yet.
            </div>
          ) : (
            myTickets.map((t) => (
              <div
                key={t._id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(16, 25, 46, 0.9) 0%, rgba(30, 58, 138, 0.25) 100%)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Official Event Admission Pass
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {t.eventId?.title || 'Campus Event'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#93c5fd', marginBottom: '1rem' }}>
                  Pass Holder: <strong>{currentUser.name}</strong> ({currentUser.gtuEnrollment || 'GTU'})
                </div>

                {t.qrCode ? (
                  <img
                    src={t.qrCode}
                    alt="Admission QR Pass"
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: 12,
                      background: '#fff',
                      padding: 8,
                      marginBottom: '1rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  />
                ) : (
                  <div style={{ padding: '2rem', background: '#fff', color: '#000', borderRadius: 8, marginBottom: '1rem' }}>
                    [QR CODE]
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'monospace',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    letterSpacing: '0.08em',
                    marginBottom: '0.75rem',
                  }}
                >
                  {t.ticketNumber}
                </div>

                <div style={{ fontSize: '0.75rem', color: t.isCheckedIn ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                  {t.isCheckedIn ? '✓ CHECKED-IN AT ENTRANCE' : '● ADMISSION CONFIRMED'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Organizer Scanner Simulation */}
      {activeTab === 'scanner' && (
        <div className="glass-panel" style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scan color="#3b82f6" /> Registration Desk Check-In Scanner
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Campus event organizers scan attendee QR codes or enter the ticket number to verify alumni identities and record admissions in real time.
          </p>

          <form onSubmit={handleCheckIn}>
            <div className="form-group">
              <label className="form-label">Scan Barcode / Enter Ticket Number (e.g. TKT-GTU-...)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Paste or scan ticket number..."
                value={checkInTicketNumber}
                onChange={(e) => setCheckInTicketNumber(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '1rem' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
              <CheckCircle2 size={18} /> Verify Admission & Check In
            </button>
          </form>

          {checkInResult && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                borderRadius: 8,
                background: checkInResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${checkInResult.success ? '#10b981' : '#ef4444'}`,
                color: checkInResult.success ? '#34d399' : '#f87171',
                fontSize: '0.9rem',
              }}
            >
              {checkInResult.message}
            </div>
          )}
        </div>
      )}

      {/* Schedule Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Schedule College Event</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Organize alumni chapter meets, hackathons, or workshops.
            </p>

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Annual Alumni Convocation & Dinner 2026"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-select"
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                  >
                    <option value="REUNION">Department Reunion</option>
                    <option value="WORKSHOP">Technical Workshop</option>
                    <option value="WEBINAR">Global Webinar</option>
                    <option value="NETWORKING">Networking Mixer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Attendee Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Auditorium Hall, LDCE Campus"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description & Agenda</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket QR Modal */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
              {selectedTicket.eventId?.title || 'Campus Event Pass'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Show this QR code at the campus security gate or registration desk.
            </p>

            {selectedTicket.qrCode && (
              <img
                src={selectedTicket.qrCode}
                alt="Ticket QR Code"
                style={{
                  width: 200,
                  height: 200,
                  background: '#fff',
                  padding: 10,
                  borderRadius: 12,
                  margin: '0 auto 1.25rem',
                }}
              />
            )}

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.5rem',
                borderRadius: 8,
                marginBottom: '1.5rem',
              }}
            >
              {selectedTicket.ticketNumber}
            </div>

            <button onClick={() => setSelectedTicket(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
