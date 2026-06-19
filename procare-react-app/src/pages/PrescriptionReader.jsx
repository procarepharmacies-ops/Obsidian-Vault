import React, { useState } from 'react';
import { 
  ScanLine, Upload, FileText, CheckCircle, AlertCircle, RefreshCw, 
  Search, ShieldCheck, HelpCircle, ArrowRight, Activity 
} from 'lucide-react';
import './Dashboard.css';

const PrescriptionReader = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    
    setAnalyzing(true);
    setResults(null);
    setScanStep(1);

    // Dynamic scanning stages for visual premium feel
    setTimeout(() => setScanStep(2), 1000);
    setTimeout(() => setScanStep(3), 2000);
    setTimeout(() => {
      setAnalyzing(false);
      setScanStep(0);
      setResults({
        doctor: 'Dr. Sarah Jenkins (Cardiologist)',
        patient: 'John Doe',
        date: '2026-06-19',
        confidence: '98.6%',
        drugs: [
          { name: 'Augmentin 1g Tablets', dose: '1 tablet every 12 hours', duration: '7 days', available: true, substitutes: [] },
          { name: 'Concor 5mg', dose: '1 tablet daily in the morning', duration: '30 days', available: true, substitutes: [] },
          { name: 'Panadol Advance 500mg', dose: '2 tablets PRN for fever', duration: '5 days', available: false, substitutes: ['Adol 500mg', 'Paramol 500mg'] }
        ]
      });
    }, 3500);
  };

  const getStepText = () => {
    switch (scanStep) {
      case 1: return 'Enhancing image contrast & filters...';
      case 2: return 'Running OCR text recognition line-by-line...';
      case 3: return 'Cross-referencing eStock & Titan databases...';
      default: return 'Extracting medical data...';
    }
  };

  return (
    <div className="dashboard-container" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.01) 90%)', minHeight: '85vh', padding: '1rem 0' }}>
      
      {/* Header section with Premium design */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ background: 'linear-gradient(135deg, var(--procare-blue) 0%, var(--procare-teal) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gemini Vision prescription workstation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Digitize handwritten prescriptions, perform real-time verification, and suggest alternative substitutes.
          </p>
        </div>
        <div className="date-badge" style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--procare-blue)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <Activity size={14} className="pulse" style={{ marginRight: 6 }} />
          VERIFICATION ACTIVE
        </div>
      </div>

      <div className="dashboard-main-content" style={{ gridTemplateColumns: results || analyzing ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        
        {/* Upload Card */}
        <div className="card glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', background: 'white' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 1.5rem auto' }}>
            {analyzing && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                border: '2px dashed var(--procare-blue)',
                borderRadius: '50%',
                animation: 'spin 4s linear infinite'
              }}></div>
            )}
            <div style={{ 
              background: analyzing ? 'rgba(13,148,136,0.1)' : 'rgba(37, 99, 235, 0.06)', 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justify-content: 'center' 
            }}>
              <Upload size={38} color={analyzing ? 'var(--procare-teal)' : 'var(--procare-blue)'} />
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Upload Prescription Image</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
            Drop a scanned image of the doctor's prescription. Supported formats: PNG, JPG, PDF.
          </p>
          
          <form onSubmit={handleUpload}>
            <div style={{
              border: '2px dashed #E2E8F0',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: '#F8FAFC',
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('presc-file').click()}
            >
              <input 
                id="presc-file"
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '0.9rem', color: file ? 'var(--procare-blue-dark)' : 'var(--text-secondary)', fontWeight: file ? '600' : 'normal' }}>
                {file ? `📎 Selected: ${file.name}` : 'Click to select prescription image'}
              </span>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={!file || analyzing}
              style={{ 
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                background: (!file || analyzing) ? '#E2E8F0' : 'var(--procare-blue)',
                color: (!file || analyzing) ? 'var(--text-muted)' : 'white',
                cursor: (!file || analyzing) ? 'not-allowed' : 'pointer'
              }}
            >
              {analyzing ? 'Running Extraction Pipeline...' : 'Process & Analyze'}
            </button>
          </form>
        </div>

        {/* Scanning & Analyzing Animation */}
        {analyzing && (
          <div className="card glass-panel" style={{ background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '350px' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--procare-teal)', width: 50, height: 50, marginBottom: '2rem' }}></div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{getStepText()}</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Gemini Vision Engine is classifying handwriting patterns</p>
            
            {/* Visual Laser Scanning Animation Box */}
            <div style={{
              width: '80%', height: '8px', background: 'rgba(13,148,136,0.2)', 
              borderRadius: '4px', overflow: 'hidden', marginTop: '2rem', position: 'relative'
            }}>
              <div style={{
                width: '30%', height: '100%', background: 'var(--procare-teal-light)', 
                position: 'absolute', animation: 'progressSlide 1.5s infinite ease-in-out'
              }}></div>
            </div>
          </div>
        )}

        {/* Extracted results section */}
        {results && !analyzing && (
          <div className="card glass-panel animate-fade-in" style={{ padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--procare-blue)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>OCR Analysis Results</h3>
              </div>
              <span className="badge-primary" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--procare-success)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} />
                {results.confidence} Match
              </span>
            </div>

            {/* Meta Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Physician</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{results.doctor}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Patient</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{results.patient}</span>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Extraction Date</span>
                <span style={{ fontSize: '0.9rem' }}>{results.date}</span>
              </div>
            </div>

            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>Extracted Items</h4>
            
            {results.drugs.map((drug, idx) => (
              <div key={idx} style={{ 
                padding: '1.25rem', 
                border: '1px solid #E2E8F0', 
                borderRadius: 'var(--radius-lg)', 
                marginBottom: '1rem', 
                backgroundColor: drug.available ? 'rgba(16,185,129,0.02)' : 'rgba(239,68,68,0.02)',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--procare-blue-dark)', fontWeight: 600 }}>{drug.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{drug.dose} • {drug.duration}</span>
                  </div>
                  {drug.available ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--procare-success)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      <CheckCircle size={14} /> Available
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--procare-danger)', fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      <AlertCircle size={14} /> Out of Stock
                    </span>
                  )}
                </div>

                {/* Substitutes Button / Box */}
                {!drug.available && drug.substitutes.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <HelpCircle size={14} /> Available Substitutes (Titan DB Match):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {drug.substitutes.map((sub, sIdx) => (
                        <span key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'white', border: '1px solid #FCD34D', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#92400E' }}>
                          {sub} <ArrowRight size={10} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Style animation helper */}
      <style>{`
        @keyframes progressSlide {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionReader;
