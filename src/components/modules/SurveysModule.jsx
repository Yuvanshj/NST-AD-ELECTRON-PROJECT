import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  BarChart3,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function SurveysModule() {
  const { currentUser } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const res = await api.surveys.getAll();
      if (res.surveys) {
        setSurveys(res.surveys);
        if (res.surveys.length > 0 && !activeSurvey) {
          selectSurvey(res.surveys[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectSurvey = async (survey) => {
    setActiveSurvey(survey);
    setAnswers({});
    setSuccessMsg('');
    try {
      const res = await api.surveys.getResults(survey._id);
      if (res.results) {
        setResults(res.results);
      }
    } catch (e) {
      setResults(null);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!activeSurvey) return;

    try {
      const formattedAnswers = Object.entries(answers).map(([qIdx, selectedOption]) => ({
        questionIndex: Number(qIdx),
        selectedOption,
      }));

      await api.surveys.submitResponse(activeSurvey._id, {
        userId: currentUser._id,
        answers: formattedAnswers,
      });

      setSuccessMsg('Your feedback has been submitted to the Higher Education Council!');
      const res = await api.surveys.getResults(activeSurvey._id);
      if (res.results) setResults(res.results);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Error submitting survey: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span>Curriculum Pulse & Surveys</span>
          <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>NEP 2020 FEEDBACK</span>
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
          Alumni guide GTU syllabus modernization, NEP 2020 industry skill alignment, and campus lab infrastructure priorities.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Split layout: Survey selector & Active Survey Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(460px, 1.8fr)', gap: '2rem' }}>
        {/* Left: Survey List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {surveys.map((s) => {
            const isSelected = activeSurvey?._id === s._id;
            return (
              <div
                key={s._id}
                onClick={() => selectSurvey(s)}
                className="glass-panel interactive"
                style={{
                  padding: '1.75rem',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  background: isSelected ? '#141419' : 'var(--bg-card)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: '0.35rem' }}>
                  {s.collegeId?.name || 'Department of Higher Education'}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.description}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#FAFAFA', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {s.questions?.length || 0} Questions • Open Poll
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Survey Questions & Live Poll Results */}
        <div>
          {activeSurvey ? (
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {activeSurvey.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {activeSurvey.description}
              </p>

              <form onSubmit={handleSubmitResponse}>
                {activeSurvey.questions?.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      marginBottom: '2rem',
                      background: 'var(--bg-secondary)',
                      padding: '1.75rem',
                      border: '2px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', gap: '0.65rem', textTransform: 'uppercase' }}>
                      <span style={{ color: 'var(--accent)' }}>Q{qIdx + 1}.</span>
                      <span>{q.questionText}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {q.options?.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.85rem 1.25rem',
                            background: answers[qIdx] === opt ? 'var(--accent)' : 'var(--bg-primary)',
                            color: answers[qIdx] === opt ? '#000000' : '#FAFAFA',
                            border: '2px solid',
                            borderColor: answers[qIdx] === opt ? 'var(--accent)' : 'var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: answers[qIdx] === opt ? 800 : 500,
                            fontFamily: 'Space Grotesk, sans-serif',
                            textTransform: 'uppercase',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`q_${qIdx}`}
                            value={opt}
                            checked={answers[qIdx] === opt}
                            onChange={() => setAnswers({ ...answers, [qIdx]: opt })}
                            style={{ accentColor: '#000000', width: 16, height: 16 }}
                            required
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    {/* Live Results Bar preview if results exist */}
                    {results && results.totalResponses > 0 && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.65rem' }}>
                          Aggregate Community Response ({results.totalResponses} submissions)
                        </div>
                        {q.options?.map((opt, oIdx) => {
                          const count = results.breakdown?.[qIdx]?.[opt] || 0;
                          const pct = results.totalResponses ? Math.round((count / results.totalResponses) * 100) : 0;
                          return (
                            <div key={oIdx} style={{ marginBottom: '0.5rem', fontSize: '0.8rem', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FAFAFA', fontWeight: 600, marginBottom: 3 }}>
                                <span>{opt}</span>
                                <span style={{ color: 'var(--accent)' }}>{pct}% ({count})</span>
                              </div>
                              <div style={{ height: 6, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                  <Send size={16} /> Submit Verified Alumni Feedback
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a survey from the left list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
