import React, { useState, useEffect } from 'react';
import { 
  Video, Eye, Users, ShieldAlert, CheckCircle, RefreshCw, 
  UserCheck, AlertTriangle, Flame, Clock 
} from 'lucide-react';
import './Dashboard.css';

const NvrCameras = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [queueLength, setQueueLength] = useState(2);
  const [alertTriggered, setAlertTriggered] = useState(false);

  // Simulate real-time queue update
  useEffect(() => {
    const timer = setInterval(() => {
      const simulatedLength = Math.floor(Math.random() * 8) + 1;
      setQueueLength(simulatedLength);
      setAlertTriggered(simulatedLength > 5);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const cameras = [
    { id: 1, name: 'Entrance camera', status: 'Active', type: 'People Counting', count: 142 },
    { id: 2, name: 'Cashier camera', status: 'Active', type: 'Queue Detection', count: queueLength },
    { id: 3, name: 'Pharmacy shelf camera', status: 'Active', type: 'Heatmap', count: 'High Activity' },
    { id: 4, name: 'Storage room camera', status: 'Active', type: 'Security Monitoring', count: 'Secure' }
  ];

  const attendanceLog = [
    { id: 101, name: 'Dr. Ahmed Youssef', time: '08:45 AM', status: 'Present', method: 'Face ID', temp: '36.6°C' },
    { id: 102, name: 'Dr. Sarah Jenkins', time: '08:52 AM', status: 'Present', method: 'Face ID', temp: '36.4°C' },
    { id: 103, name: 'Rania Kamal (Intern)', time: '09:05 AM', status: 'Present', method: 'Face ID', temp: '36.7°C' }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ background: 'linear-gradient(135deg, var(--procare-blue) 0%, var(--procare-teal) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NVR Smart Camera Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            AI-powered queue detection, automated attendance tracking, and live heatmap telemetry.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="date-badge" style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--procare-success)', border: '1px solid rgba(16,185,129,0.2)' }}>
            ● NVR Central Connected (192.168.1.30)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('status')}
          style={{
            background: activeTab === 'status' ? 'var(--procare-blue)' : 'transparent',
            color: activeTab === 'status' ? 'white' : 'var(--text-secondary)',
            border: activeTab === 'status' ? 'none' : '1px solid #E2E8F0',
            padding: '0.5rem 1.25rem',
            borderRadius: '20px'
          }}
        >
          Camera Status
        </button>
        <button 
          onClick={() => setActiveTab('queue')}
          style={{
            background: activeTab === 'queue' ? 'var(--procare-blue)' : 'transparent',
            color: activeTab === 'queue' ? 'white' : 'var(--text-secondary)',
            border: activeTab === 'queue' ? 'none' : '1px solid #E2E8F0',
            padding: '0.5rem 1.25rem',
            borderRadius: '20px'
          }}
        >
          Queue Detection {alertTriggered && <span style={{ background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', marginLeft: '4px' }}>!</span>}
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          style={{
            background: activeTab === 'attendance' ? 'var(--procare-blue)' : 'transparent',
            color: activeTab === 'attendance' ? 'white' : 'var(--text-secondary)',
            border: activeTab === 'attendance' ? 'none' : '1px solid #E2E8F0',
            padding: '0.5rem 1.25rem',
            borderRadius: '20px'
          }}
        >
          AI Attendance Log
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-main-content" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {activeTab === 'status' && (
          <div className="card glass-panel" style={{ background: 'white' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--procare-blue-dark)' }}>
              <Video size={22} /> Active NVR Channels
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {cameras.map(cam => (
                <div key={cam.id} style={{ border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: '#F8FAFC', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{cam.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--procare-success)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      <CheckCircle size={12} /> {cam.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Function: <strong style={{ color: 'var(--text-primary)' }}>{cam.type}</strong></div>
                    <div style={{ marginTop: '0.25rem' }}>Telemetry: <strong style={{ color: 'var(--procare-blue)' }}>{cam.count}</strong></div>
                  </div>
                  
                  {/* Camera snapshot placeholder */}
                  <div style={{ marginTop: '1rem', width: '100%', height: '120px', background: '#0F172A', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(239,68,68,0.8)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      ● LIVE REC
                    </div>
                    <Eye size={30} color="rgba(255,255,255,0.3)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="card glass-panel" style={{ background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--procare-blue-dark)', margin: 0 }}>
                <Users size={22} /> Cashier Queue Status
              </h3>
              {alertTriggered ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--procare-danger)', fontWeight: 600, padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  <ShieldAlert size={16} /> Alert: Queue Overflow!
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', color: 'var(--procare-success)', fontWeight: 600, padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  <CheckCircle size={16} /> Normal Queue Size
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Queue Length</span>
                  <div style={{ fontSize: '3rem', fontWeight: 700, color: alertTriggered ? 'var(--procare-danger)' : 'var(--procare-blue-dark)', margin: '0.5rem 0' }}>
                    {queueLength}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Threshold: 5 People</span>
                </div>
                
                {alertTriggered && (
                  <div style={{ padding: '1rem', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#C53030' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>Queue length is {queueLength}!</strong> Open an additional checkout counter immediately to maintain service speeds.
                    </div>
                  </div>
                )}
              </div>

              {/* Heatmap visualization placeholder */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 'var(--radius-lg)', padding: '1.5rem', background: '#0F172A', color: 'white', position: 'relative' }}>
                <h4 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', marginBottom: '1rem' }}>
                  <Flame size={18} color="orange" /> Real-time Queue Heatmap
                </h4>
                <div style={{ height: '200px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(245,158,11,0.1) 40%, rgba(0,0,0,0) 80%)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Interactive Heatmap Grid Telemetry</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="card glass-panel" style={{ background: 'white' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--procare-blue-dark)' }}>
              <UserCheck size={22} /> Face ID Attendance Registry (Branch Mashala)
            </h3>
            
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Sign In Time</th>
                  <th>Verification Mode</th>
                  <th>Temperature</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLog.map(log => (
                  <tr key={log.id}>
                    <td><strong>{log.id}</strong></td>
                    <td>{log.name}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}><Clock size={14} /> {log.time}</span></td>
                    <td>{log.method}</td>
                    <td>{log.temp}</td>
                    <td>
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--procare-success)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default NvrCameras;
