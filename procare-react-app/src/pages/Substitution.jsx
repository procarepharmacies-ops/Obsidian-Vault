import React, { useState } from 'react';
import { Replace, Search, CheckCircle, AlertTriangle, Pill } from 'lucide-react';
import './Dashboard.css';

const Substitution = () => {
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const mockAlternatives = [
    { name: 'Panadol Advance 500mg', type: 'Exact Match', price: 45, stock: 120, match: '100%', active: 'Paracetamol' },
    { name: 'Adol 500mg', type: 'Exact Match', price: 30, stock: 45, match: '100%', active: 'Paracetamol' },
    { name: 'Cetal 500mg', type: 'Therapeutic', price: 20, stock: 200, match: '100%', active: 'Paracetamol' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if(search.trim()) setHasSearched(true);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Smart Drug Substitution</h1>
        <div className="date-badge">
          <Replace size={14} style={{ marginRight: 6 }} />
          AI Alternative Finder
        </div>
      </div>

      <div className="card glass" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Find Medication Alternatives</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
            <input 
              type="text" 
              placeholder="Enter drug name (e.g. Novaldol)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 24px', borderRadius: '12px', background: 'var(--primary-color)', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="dashboard-main-content" style={{ gridTemplateColumns: '1fr' }}>
          <div className="card glass">
            <div className="card-header">
              <h3>Results for: <span style={{ color: 'var(--primary-color)' }}>{search}</span></h3>
              <span className="badge-primary" style={{ background: 'rgba(0, 212, 168, 0.15)', color: '#00d4a8', borderColor: 'rgba(0, 212, 168, 0.3)' }}>Active: Paracetamol 500mg</span>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              {mockAlternatives.map((alt, idx) => (
                <div key={idx} style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%' }}>
                      <Pill size={24} color="#3b82f6" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#fff' }}>{alt.name}</h4>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{alt.active}</span>
                        <span style={{ color: alt.type === 'Exact Match' ? '#00d4a8' : '#f59e0b', fontWeight: 600 }}>• {alt.type}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00d4a8', marginBottom: '4px' }}>E£ {alt.price}</div>
                    <div style={{ fontSize: '0.85rem', color: alt.stock > 50 ? '#00d4a8' : '#ff4d6d' }}>
                      {alt.stock > 0 ? `${alt.stock} in stock` : 'Out of Stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Substitution;
