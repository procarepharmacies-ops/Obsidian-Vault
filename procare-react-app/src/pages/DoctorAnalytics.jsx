import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Stethoscope, AlertTriangle, PackagePlus, TrendingUp, Search } from 'lucide-react';
import './Dashboard.css';

const mockHabits = [
  { doctor: "Dr. Mahmoud Nageeb", drug: "Septazole Susp", qty: 45 },
  { doctor: "Dr. Mahmoud Nageeb", drug: "Cefix 100mg/5ml", qty: 38 },
  { doctor: "Dr. Mahmoud Nageeb", drug: "Motinorm Susp", qty: 30 },
  { doctor: "Dr. Mayada Alashry", drug: "Minoxidil 5%", qty: 50 },
  { doctor: "Dr. Mayada Alashry", drug: "Seralene Shampoo", qty: 25 },
  { doctor: "Dr. Mostafa Dawood", drug: "Xiron 17mg Drops", qty: 40 },
  { doctor: "Dr. Mostafa Dawood", drug: "Kapron 500mg", qty: 20 },
];

const mockMustAvailable = [
  { drug: "Cefix 100mg/5ml", current: 0, rxFreq: 38, orderQty: 57, status: "CRITICAL" },
  { drug: "Septazole Susp", current: 5, rxFreq: 45, orderQty: 63, status: "LOW" },
  { drug: "Minoxidil 5%", current: 2, rxFreq: 50, orderQty: 73, status: "CRITICAL" },
  { drug: "Xiron 17mg Drops", current: 15, rxFreq: 40, orderQty: 45, status: "LOW" }
];

const COLORS = ['#00d4a8', '#3b82f6', '#f59e0b', '#e11d48', '#8b5cf6'];

const DoctorAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group by doctor for the pie chart
  const doctorTotals = mockHabits.reduce((acc, curr) => {
    acc[curr.doctor] = (acc[curr.doctor] || 0) + curr.qty;
    return acc;
  }, {});
  
  const pieData = Object.keys(doctorTotals).map(doc => ({
    name: doc,
    value: doctorTotals[doc]
  }));

  const filteredHabits = mockHabits.filter(h => h.doctor.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Area Doctor Analytics & Inventory Forecast</h1>
        <div className="date-badge">
          <Stethoscope size={14} style={{ marginRight: 6 }} />
          Prescription Insights
        </div>
      </div>

      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Total Prescriptions Analyzed</h3>
            <Stethoscope size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">248</h2>
        </div>
        <div className="card stat-card glass" style={{ borderLeft: '4px solid #e11d48' }}>
          <div className="stat-header">
            <h3 className="text-muted">Critical Restock Alerts</h3>
            <AlertTriangle size={20} color="#e11d48" />
          </div>
          <h2 className="stat-value">2</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Top Prescribed Area Drug</h3>
            <TrendingUp size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Minoxidil 5% (50 Rx)</h2>
        </div>
      </div>

      <div className="dashboard-main-content">
        
        {/* Doctor Prescribing Habits Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Prescription Volume by Doctor</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', height: '300px' }}>
            <ResponsiveContainer width="40%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <Search size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: '8px' }} />
                <input type="text" placeholder="Search Doctor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%' }} />
              </div>
              
              {filteredHabits.map((habit, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{habit.drug}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{habit.doctor}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#00d4a8' }}>{habit.qty} Rx</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Must Available Drugs Table */}
        <div className="card glass">
          <div className="card-header">
            <h3><PackagePlus size={18} style={{ marginRight: 8, color: '#f59e0b' }} /> MUST AVAILABLE Restock Forecast</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target = 1.5x Rx Frequency</span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Drug Name</th>
                <th style={{ padding: '12px' }}>Rx Frequency</th>
                <th style={{ padding: '12px' }}>Current Stock</th>
                <th style={{ padding: '12px' }}>Recommended Order</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockMustAvailable.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>{item.drug}</td>
                  <td style={{ padding: '12px', color: '#3b82f6', fontWeight: 600 }}>{item.rxFreq}</td>
                  <td style={{ padding: '12px', color: item.current === 0 ? '#e11d48' : 'var(--text-muted)' }}>{item.current}</td>
                  <td style={{ padding: '12px', color: '#00d4a8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PackagePlus size={14} />
                    +{item.orderQty}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: item.status === 'CRITICAL' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: item.status === 'CRITICAL' ? '#e11d48' : '#f59e0b'
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default DoctorAnalytics;
