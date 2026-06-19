import React, { useState } from 'react';
import { Sparkles, MessageSquare, ShieldAlert, Pill } from 'lucide-react';
import './Dashboard.css';

const AiOtc = () => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    if(!symptoms) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRecommendation({
        diagnosis: "Likely Viral Upper Respiratory Infection (Common Cold)",
        primary: [
          { name: "Comtrex / Congestal", reason: "For symptom relief (fever, congestion, aches)", dose: "1 tablet every 8 hours" },
          { name: "C-Retard 500mg", reason: "Vitamin C to support immunity", dose: "1 capsule daily" }
        ],
        contraindications: "Avoid NSAIDs if patient has history of gastritis. Ensure patient does not take additional Paracetamol as Comtrex already contains it.",
        redFlags: "If fever persists > 3 days or difficulty breathing occurs, refer to physician immediately."
      });
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">AI OTC Recommender</h1>
        <div className="date-badge">
          <Sparkles size={14} style={{ marginRight: 6 }} />
          Clinical Assistant
        </div>
      </div>

      <div className="dashboard-main-content" style={{ gridTemplateColumns: recommendation ? '1fr 1fr' : '1fr' }}>
        <div className="card glass" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h3>Patient Case Input</h3>
          </div>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Presenting Symptoms</label>
              <textarea 
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Sore throat, runny nose, mild fever (38C) for 2 days..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '0.95rem', resize: 'vertical', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Age Group</label>
                <select 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                >
                  <option value="">Select Age</option>
                  <option value="pediatric">Pediatric (0-12)</option>
                  <option value="teen">Teen (13-17)</option>
                  <option value="adult">Adult (18-64)</option>
                  <option value="geriatric">Geriatric (65+)</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pre-existing Conditions / Allergies</label>
                <input 
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g. Hypertension, Penicillin allergy"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || !symptoms}
              style={{ padding: '14px', borderRadius: '8px', background: 'var(--primary-color)', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: (loading || !symptoms) ? 'not-allowed' : 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Sparkles size={18} />
              {loading ? 'Analyzing Case...' : 'Generate AI Recommendation'}
            </button>
          </form>
        </div>

        {recommendation && (
          <div className="card glass" style={{ borderLeft: '4px solid var(--primary-color)' }}>
            <div className="card-header">
              <h3>AI Assessment</h3>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Possible Diagnosis</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '0.5rem 0 0 0' }}>{recommendation.diagnosis}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recommended OTC</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {recommendation.primary.map((drug, idx) => (
                    <div key={idx} style={{ background: 'rgba(0, 212, 168, 0.05)', border: '1px solid rgba(0, 212, 168, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem' }}>
                      <Pill size={24} color="#00d4a8" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{drug.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{drug.reason}</div>
                        <div style={{ fontSize: '0.85rem', color: '#00d4a8', marginTop: '4px', fontWeight: 500 }}>{drug.dose}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 77, 109, 0.05)', border: '1px solid rgba(255, 77, 109, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d6d', fontWeight: 'bold', marginBottom: '8px' }}>
                  <ShieldAlert size={18} />
                  Contraindications & Warnings
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{recommendation.contraindications}</p>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <strong style={{ color: '#f59e0b', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Referral Red Flags:</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{recommendation.redFlags}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiOtc;
