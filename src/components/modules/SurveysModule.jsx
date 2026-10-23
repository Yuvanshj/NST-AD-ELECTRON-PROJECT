import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  BarChart3,
  CheckCircle2,
  HelpCircle,
  Plus,
  Send,
  Building2,
  PieChart,
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
      // Reload results
      const res = await api.surveys.getResults(activeSurvey._id);
      if (res.results) setResults(res.results);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Error submitting survey: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <BarChart3 color="#3b82f6" /> Curriculum Pulse & Governance Surveys
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Direct feedback mechanism: Alumni guide GTU syllabus modernization, NEP 2020 skill alignment, and campus infrastructure priorities.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.85rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Split layout: Survey selector & Active Survey Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(450px, 1.8fr)', gap: '1.5rem' }}>
        {/* Left: Survey List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {surveys.map((s) => {
            const isSelected = activeSurvey?._id === s._id;
            return (
              <div
                key={s._id}
                onClick={() => selectSurvey(s)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {s.collegeId?.name || 'Department of Higher Education'}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.description}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                  {s.questions?.length || 0} Questions • Open Poll
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Survey Questions & Live Poll Results */}
        <div>
          {activeSurvey ? (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {activeSurvey.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
                {activeSurvey.description}
              </p>

              <form onSubmit={handleSubmitResponse}>
                {activeSurvey.questions?.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      marginBottom: '1.75rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '1.25rem',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#60a5fa' }}>Q{qIdx + 1}.</span>
                      <span>{q.questionText}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {q.options?.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 6,
                            background: answers[qIdx] === opt ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: answers[qIdx] === opt ? '1px solid #3b82f6' : '1px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`q_${qIdx}`}
                            value={opt}
                            checked={answers[qIdx] === opt}
                            onChange={() => setAnswers({ ...answers, [qIdx]: opt })}
                            required
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    {/* Live Results Bar preview if results exist */}
                    {results && results.totalResponses > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          Aggregate Community Response ({results.totalResponses} submissions)
                        </div>
                        {q.options?.map((opt, oIdx) => {
                          const count = results.breakdown?.[qIdx]?.[opt] || 0;
                          const pct = results.totalResponses ? Math.round((count / results.totalResponses) * 100) : 0;
                          return (
                            <div key={oIdx} style={{ marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 2 }}>
                                <span>{opt}</span>
                                <span>{pct}% ({count})</span>
                              </div>
                              <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2 }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                  <Send size={16} /> Submit Verified Alumni Feedback
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a survey from the left list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
