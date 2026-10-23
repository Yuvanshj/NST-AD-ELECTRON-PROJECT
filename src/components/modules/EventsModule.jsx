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
  const [activeTab, setActiveTab] = useState('upcoming');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span>Campus Summits & Events</span>
            <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>QR ADMISSION</span>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
            College convocations, departmental reunions, and state summits with verifiable paperless QR admission badges.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={16} /> Schedule Campus Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Loading upcoming events...
            </div>
          ) : events.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
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
                <div key={ev._id} className="glass-panel interactive" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="badge badge-referral">{ev.eventType}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{ev.collegeId?.name}</span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>{ev.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', minHeight: 45 }}>
                      {ev.description}
                    </p>

                    <div style={{ fontSize: '0.85rem', color: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={15} color="var(--accent)" />
                        <span style={{ textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>{dateStr}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={15} color="var(--accent)" />
                        <span>{ev.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={15} color="#10b981" />
                        <span style={{ fontWeight: 600 }}>{ev.attendeeCount || 0} / {ev.capacity} Confirmed Attendees</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.5rem' }}>
                    {isRegistered ? (
                      <button
                        onClick={() => {
                          const ticket = myTickets.find((t) => t.eventId?._id === ev._id);
                          setSelectedTicket(ticket);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', gap: '0.5rem', borderColor: '#10b981', color: '#10b981' }}
                      >
                        <CheckCircle2 size={16} color="#10b981" /> View QR Event Pass
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {myTickets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              You have not registered for any events yet.
            </div>
          ) : (
            myTickets.map((t) => (
              <div
                key={t._id}
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--accent)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Official Event Admission Pass
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {t.eventId?.title || 'Campus Event'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                  Pass Holder: <strong style={{ color: '#FAFAFA' }}>{currentUser.name}</strong> ({currentUser.gtuEnrollment || 'GTU'})
                </div>

                {t.qrCode ? (
                  <img
                    src={t.qrCode}
                    alt="Admission QR Pass"
                    style={{
                      width: 180,
                      height: 180,
                      background: '#ffffff',
                      padding: 10,
                      border: '2px solid #000000',
                      marginBottom: '1.25rem',
                    }}
                  />
                ) : (
                  <div style={{ padding: '2rem', background: '#ffffff', color: '#000000', border: '2px solid #000000', marginBottom: '1.25rem', fontWeight: 900 }}>
                    [QR CODE]
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'monospace',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                    color: 'var(--accent)',
                  }}
                >
                  {t.ticketNumber}
                </div>

                <div style={{ fontSize: '0.8rem', color: t.isCheckedIn ? '#10b981' : 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.isCheckedIn ? '✓ CHECKED-IN AT ENTRANCE' : '● ADMISSION CONFIRMED'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Organizer Scanner Simulation */}
      {activeTab === 'scanner' && (
        <div className="glass-panel" style={{ maxWidth: 640, margin: '0 auto', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Scan color="var(--accent)" /> Desk QR Scanner & Verification
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
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
                style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.95rem' }}>
              <CheckCircle2 size={18} /> Verify Admission & Check In
            </button>
          </form>

          {checkInResult && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem',
                background: checkInResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `2px solid ${checkInResult.success ? '#10b981' : '#ef4444'}`,
                color: checkInResult.success ? '#10b981' : '#ef4444',
                fontSize: '0.95rem',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
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
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Schedule College Event</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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
          <div className="modal-dialog" style={{ maxWidth: 440, textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              {selectedTicket.eventId?.title || 'Campus Event Pass'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Show this QR code at the campus security gate or registration desk.
            </p>

            {selectedTicket.qrCode && (
              <img
                src={selectedTicket.qrCode}
                alt="Ticket QR Code"
                style={{
                  width: 200,
                  height: 200,
                  background: '#ffffff',
                  padding: 10,
                  border: '2px solid #000000',
                  margin: '0 auto 1.5rem',
                }}
              />
            )}

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1.05rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                padding: '0.65rem',
                marginBottom: '1.75rem',
                color: 'var(--accent)',
                fontWeight: 700,
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
