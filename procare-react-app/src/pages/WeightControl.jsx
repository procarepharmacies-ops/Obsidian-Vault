import React, { useState } from 'react';
import { Scale, Activity, Search, Target, Utensils } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Dashboard.css';

const WeightControl = () => {
  const [customerCode, setCustomerCode] = useState('');
  const [profile, setProfile] = useState(null);

  const mockProgress = [
    { date: 'Jan 15', weight: 92.5, fat: 28 },
    { date: 'Feb 15', weight: 89.2, fat: 26 },
    { date: 'Mar 15', weight: 87.0, fat: 24.5 },
    { date: 'Apr 15', weight: 85.5, fat: 23 },
    { date: 'May 15', weight: 84.1, fat: 21.8 },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!customerCode) return;
    
    // Mock patient load
    setProfile({
      name: 'Sarah Ahmed',
      code: customerCode,
      age: 34,
      height: 165,
      latest: { weight: 84.1, fatPct: 21.8, muscle: 28.5, water: 45.2 },
      target: { weight: 75, fatPct: 18 }
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">InBody Weight Control Program</h1>
        <div className="date-badge">
          <Scale size={14} style={{ marginRight: 6 }} />
          Patient Counseling
        </div>
      </div>

      <div className="card glass" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Enter Customer Code (e.g. CUST-8821)..." 
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 24px', borderRadius: '8px', background: 'var(--primary-color)', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            Load Profile
          </button>
        </form>
      </div>

      {profile && (
        <>
          <div className="grid-cards kpi-grid">
            <div className="card stat-card glass">
              <div className="stat-header">
                <h3 className="text-muted">Current Weight</h3>
                <Scale size={20} color="#3b82f6" />
              </div>
              <h2 className="stat-value">{profile.latest.weight} kg</h2>
              <div className="stat-footer text-success">
                Target: {profile.target.weight} kg
              </div>
            </div>
            <div className="card stat-card glass">
              <div className="stat-header">
                <h3 className="text-muted">Body Fat %</h3>
                <Activity size={20} color="#f59e0b" />
              </div>
              <h2 className="stat-value">{profile.latest.fatPct}%</h2>
              <div className="stat-footer text-success">
                Target: {profile.target.fatPct}%
              </div>
            </div>
            <div className="card stat-card glass">
              <div className="stat-header">
                <h3 className="text-muted">Skeletal Muscle</h3>
                <Target size={20} color="#00d4a8" />
              </div>
              <h2 className="stat-value">{profile.latest.muscle} kg</h2>
            </div>
          </div>

          <div className="dashboard-main-content">
            <div className="card chart-card glass">
              <div className="card-header">
                <h3>Progress History</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockProgress} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.4)" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} itemStyle={{ color: '#fff' }} />
                  <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3b82f6" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="fat" name="Fat %" stroke="#f59e0b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card glass">
              <div className="card-header">
                <h3><Utensils size={18} style={{ marginRight: 8 }} /> AI Recommended Diet & Plan</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', height: 'calc(100% - 60px)' }}>
                <h4 style={{ color: '#00d4a8', marginBottom: '1rem' }}>Phase 3: Stabilization & Toning</h4>
                <p className="text-muted" style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>Based on the latest InBody scan, the patient is losing fat while maintaining muscle mass perfectly. Recommend increasing protein intake by 15g/day to further support skeletal muscle development.</p>
                
                <h5 style={{ color: '#fff', marginBottom: '0.75rem' }}>Dietary Adjustments:</h5>
                <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  <li>Breakfast: Add 1 scoop whey isolate or 2 egg whites.</li>
                  <li>Reduce evening carbohydrate intake (cut rice/bread after 6 PM).</li>
                  <li>Hydration: Maintain 3L water/day.</li>
                </ul>

                <h5 style={{ color: '#fff', marginBottom: '0.75rem' }}>Pharmacy Supplements:</h5>
                <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                  <li><strong>Omega-3</strong> (1000mg daily) for joint support.</li>
                  <li><strong>L-Carnitine</strong> (1000mg pre-workout) to assist fat oxidation.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeightControl;
