import React, { useState } from 'react';
import { KanbanSquare, MessageSquare, CheckCircle, Clock, UserCircle, Bell, ArrowRight } from 'lucide-react';
import './Dashboard.css';

const initialTasks = [
  { id: 'T-101', title: 'Check fridge temperature', assignee: 'Dr. Youssef', status: 'TODO', priority: 'High' },
  { id: 'T-102', title: 'Restock Panadol shelves', assignee: 'Mohamed', status: 'IN_PROGRESS', priority: 'Medium' },
  { id: 'T-103', title: 'Follow up with patient CUST-8821', assignee: 'Dr. Ahmed', status: 'TODO', priority: 'High' },
  { id: 'T-104', title: 'Daily Cash Close', assignee: 'Ali', status: 'DONE', priority: 'High' }
];

const OperationsKanban = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [notification, setNotification] = useState(null);

  const moveTask = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    // Simulate Slack Notification Trigger
    triggerSlackNotification(task, newStatus);
  };

  const triggerSlackNotification = (task, newStatus) => {
    const message = `🔔 *Task Update*: ${task.title} is now *${newStatus.replace('_', ' ')}*. Assigned to: ${task.assignee}.`;
    
    setNotification(message);
    
    // In production, this would call your backend endpoint:
    // fetch('/api/slack/notify', { method: 'POST', body: JSON.stringify({ message }) })
    
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const renderColumn = (status, title, icon) => {
    const colTasks = tasks.filter(t => t.status === status);
    
    return (
      <div style={{ flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
          {icon}
          {title}
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', marginLeft: 'auto' }}>
            {colTasks.length}
          </span>
        </div>
        
        {colTasks.map(task => (
          <div key={task.id} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.id}</span>
              <span style={{ fontSize: '0.75rem', background: task.priority === 'High' ? 'rgba(255,77,109,0.15)' : 'rgba(245,158,11,0.15)', color: task.priority === 'High' ? '#ff4d6d' : '#f59e0b', padding: '2px 8px', borderRadius: '4px' }}>
                {task.priority}
              </span>
            </div>
            <h4 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '0.95rem' }}>{task.title}</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <UserCircle size={14} />
                {task.assignee}
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {status !== 'TODO' && (
                  <button onClick={() => moveTask(task.id, 'TODO')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '4px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                )}
                {status !== 'IN_PROGRESS' && (
                  <button onClick={() => moveTask(task.id, 'IN_PROGRESS')} style={{ background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '4px', padding: '4px 8px', color: '#3b82f6', cursor: 'pointer' }}>
                    <Clock size={14} />
                  </button>
                )}
                {status !== 'DONE' && (
                  <button onClick={() => moveTask(task.id, 'DONE')} style={{ background: 'transparent', border: '1px solid rgba(0,212,168,0.3)', borderRadius: '4px', padding: '4px 8px', color: '#00d4a8', cursor: 'pointer' }}>
                    <CheckCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Operations Kanban</h1>
        <div className="date-badge" style={{ background: 'rgba(224, 30, 90, 0.1)', color: '#E01E5A', border: '1px solid rgba(224, 30, 90, 0.2)' }}>
          <MessageSquare size={14} style={{ marginRight: 6 }} />
          Slack Sync Active
        </div>
      </div>

      {/* Mock Slack Notification Toast */}
      {notification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0f172a', border: '1px solid #E01E5A', borderLeft: '4px solid #E01E5A', borderRadius: '8px', padding: '1rem', color: '#fff', display: 'flex', alignItems: 'flex-start', gap: '12px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease-out' }}>
          <MessageSquare size={24} color="#E01E5A" />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>Message Sent to #pharmacy-ops</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{notification}</div>
          </div>
        </div>
      )}

      <div className="card glass" style={{ padding: '2rem', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KanbanSquare size={20} color="var(--primary-color)" />
            Employee Tasks
          </h2>
          <button style={{ padding: '8px 16px', background: 'var(--primary-color)', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            + New Task
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
          {renderColumn('TODO', 'To Do', <Bell size={18} color="var(--text-muted)" />)}
          {renderColumn('IN_PROGRESS', 'In Progress', <Clock size={18} color="#3b82f6" />)}
          {renderColumn('DONE', 'Done', <CheckCircle size={18} color="#00d4a8" />)}
        </div>
      </div>
    </div>
  );
};

export default OperationsKanban;
