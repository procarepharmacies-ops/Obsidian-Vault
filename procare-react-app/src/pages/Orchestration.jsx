import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Code, PenTool, Terminal, Layers, Box, TerminalSquare, MessageSquare, RefreshCw, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import './Orchestration.css';

// --- AGENT DEFINITIONS (HIERARCHY) ---
const BOSS = { id: 'hermes', name: 'Hermes', icon: MessageSquare, role: 'Pharmacy OS Coordinator', color: '#0ea5e9' };

const MANAGERS = [
  { id: 'openhuman', name: 'OpenHuman', icon: Activity, role: 'Backend / RAG Node', color: '#10b981' },
  { id: 'antigravity', name: 'Antigravity', icon: Layers, role: 'Core System IDE', color: '#8b5cf6' }
];

const WORKERS = [
  { id: 'gemini', name: 'Gemini', icon: Cpu, role: 'Intelligence / Analytics', color: '#f59e0b' },
  { id: 'claude_coworker', name: 'Claude Coworker', icon: Box, role: 'Role-Playing Collab', color: '#f43f5e' },
  { id: 'claude_code', name: 'Claude Code', icon: Code, role: 'Developer Agent', color: '#d946ef' },
  { id: 'claude_designer', name: 'Claude Designer', icon: PenTool, role: 'UI/UX Visualizer', color: '#ec4899' },
  { id: 'claude_cli', name: 'Claude CLI', icon: Terminal, role: 'Terminal Executor', color: '#6366f1' },
  { id: 'antigravity_cli', name: 'Antigravity CLI', icon: TerminalSquare, role: 'CLI Co-Pilot', color: '#a855f7' }
];

const ALL_AGENTS = [BOSS, ...MANAGERS, ...WORKERS];

const STATUSES = ['IDLE', 'THINKING', 'EXECUTING', 'WAITING_FOR_USER'];
const STATUS_COLORS = {
  IDLE: 'rgba(255,255,255,0.4)',
  THINKING: '#f59e0b',
  EXECUTING: '#00d4a8',
  WAITING_FOR_USER: '#ff4d6d'
};

const Orchestration = () => {
  const [agentStates, setAgentStates] = useState(
    ALL_AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: 'IDLE' }), {})
  );

  const [tasks, setTasks] = useState([]);
  const [goal, setGoal] = useState("Read 50 prescriptions and restock inventory");
  const [isSimulating, setIsSimulating] = useState(false);

  const generateExecutionPlan = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsSimulating(true);

    // Initial setup for the UI simulation while waiting for the backend
    const mockPlan = [
      { id: 1, title: 'Sending task to Hermes Orchestrator', column: 'IN_PROGRESS', agent: BOSS, requiredRole: 'Pharmacy OS Coordinator' },
      { id: 2, title: 'Extracting Data / Running Scripts', column: 'TODO', agent: null, requiredRole: 'Backend / RAG Node' },
      { id: 3, title: 'Claude Evaluation', column: 'TODO', agent: null, requiredRole: 'Role-Playing Collab' }
    ];

    setTasks(mockPlan);
    setAgentStates(ALL_AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: 'IDLE' }), { [BOSS.id]: 'EXECUTING' }));

    try {
      const response = await fetch('http://localhost:8000/api/agents/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: goal, required_role: '' })
      });
      
      const data = await response.json();
      console.log("Hermes Backend Response:", data);
      
      // We update the task list with the result
      setTasks([
        { id: 1, title: 'Sending task to Hermes Orchestrator', column: 'FINISHED', agent: BOSS, requiredRole: 'Pharmacy OS Coordinator' },
        { id: 2, title: 'Extracting Data / Running Scripts', column: 'FINISHED', agent: MANAGERS[0], requiredRole: 'Backend / RAG Node' },
        { id: 3, title: 'Claude Evaluation', column: 'FINISHED', agent: WORKERS[1], requiredRole: 'Role-Playing Collab' },
        { id: 4, title: 'Result Log: ' + (data.status === 'ERROR' ? 'Failed' : 'Success'), column: 'FINISHED', agent: null, requiredRole: 'Terminal Executor' }
      ]);
      
      setAgentStates(ALL_AGENTS.reduce((acc, agent) => ({ ...acc, [agent.id]: 'IDLE' }), {}));
      
      alert(`Hermes Execution Finished!\nStatus: ${data.status}\n\nLogs:\n${data.history.join('\n')}`);
      
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend Hermes orchestrator. Is FastAPI running on port 8000?");
      setTasks(mockPlan.map(t => ({...t, column: 'TODO'})));
    } finally {
      setIsSimulating(false);
    }
  };

  // Simulation Loop for step-by-step Kanban Movement
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTasks(currentTasks => {
        let newTasks = [...currentTasks];
        let newAgentStates = { ...agentStates };

        // 1. If Boss was executing, set to IDLE after planning
        if (newAgentStates[BOSS.id] === 'EXECUTING') {
          newAgentStates[BOSS.id] = 'IDLE';
        }

        // 2. Move tasks sequentially
        let madeMove = false;
        
        for (let i = 0; i < newTasks.length; i++) {
          const task = newTasks[i];

          // Finish a task currently in review
          if (task.column === 'REVIEW') {
            newTasks[i].column = 'FINISHED';
            if (task.agent) newAgentStates[task.agent.id] = 'IDLE';
            madeMove = true;
            break;
          }

          // Move an active task to review
          if (task.column === 'IN_PROGRESS') {
            if (Math.random() > 0.3) {
              newTasks[i].column = 'REVIEW';
              newAgentStates[task.agent.id] = 'THINKING';
            }
            madeMove = true;
            break; // only process one main step at a time to simulate sequential agent collaboration
          }

          // Start a new task if none are in progress
          if (task.column === 'TODO' && !newTasks.some(t => t.column === 'IN_PROGRESS')) {
            const assignee = ALL_AGENTS.find(a => a.role === task.requiredRole) || WORKERS[0];
            newTasks[i].column = 'IN_PROGRESS';
            newTasks[i].agent = assignee;
            newAgentStates[assignee.id] = 'EXECUTING';
            madeMove = true;
            break;
          }
        }

        // 3. Stop simulation if all finished
        if (newTasks.every(t => t.column === 'FINISHED')) {
          setIsSimulating(false);
          newAgentStates[BOSS.id] = 'FINISHED'; // Make boss happy
        }

        setAgentStates(newAgentStates);
        return newTasks;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, agentStates]);

  const renderAgentCard = (agent) => {
    const status = agentStates[agent.id] || 'IDLE';
    const Icon = agent.icon;
    const isThinking = status === 'THINKING';
    
    let iconAnimClass = '';
    if (status === 'THINKING') iconAnimClass = 'spin-slow';
    if (status === 'EXECUTING') iconAnimClass = 'float';
    if (status === 'WAITING_FOR_USER') iconAnimClass = 'shake';

    return (
      <div key={agent.id} className="agent-card">
        <div className="agent-card-header">
          <div className={`agent-icon-wrapper ${iconAnimClass}`} style={{ background: `${agent.color}22`, border: `1px solid ${agent.color}44` }}>
            <Icon size={20} color={agent.color} />
          </div>
          <div className="agent-status-indicator" style={{ background: STATUS_COLORS[status] || STATUS_COLORS.IDLE, boxShadow: `0 0 8px ${STATUS_COLORS[status] || 'transparent'}` }}></div>
        </div>
        <div className="agent-details">
          <h3>{agent.name}</h3>
          <p>{agent.role}</p>
        </div>
        <div className="agent-card-footer">
          <span className="status-badge" style={{ color: STATUS_COLORS[status] || STATUS_COLORS.IDLE, border: `1px solid ${STATUS_COLORS[status] || STATUS_COLORS.IDLE}44` }}>
            {isThinking && <RefreshCw size={10} className="spin" style={{ marginRight: 4 }} />}
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>
    );
  };

  const getTasksByColumn = (col) => tasks.filter(t => t.column === col);

  return (
    <div className="orchestration-container">
      <div className="dashboard-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title">AI Fleet Command Center</h1>
        <div className="date-badge" style={{ background: 'rgba(0, 212, 168, 0.15)', color: '#00d4a8', border: '1px solid rgba(0, 212, 168, 0.3)' }}>
          <Activity size={14} style={{ marginRight: 6 }} className="pulse" />
          SYSTEM LIVE
        </div>
      </div>

      <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={20} color="var(--primary-color)" />
          User Goal:
        </div>
        <form onSubmit={generateExecutionPlan} style={{ flex: 1, display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isSimulating}
            style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
          />
          <button 
            type="submit" 
            disabled={isSimulating || !goal}
            style={{ padding: '10px 24px', background: isSimulating ? 'rgba(255,255,255,0.1)' : 'var(--primary-color)', color: '#0f172a', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: isSimulating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isSimulating ? <><RefreshCw size={18} className="spin" /> Orchestrating...</> : <><PlayCircle size={18} /> Generate Plan & Assign</>}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: Agent Hierarchy / Org Chart */}
        <div className="org-chart-section" style={{ flex: '0 0 300px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.05)', height: 'calc(100vh - 140px)' }}>
          <h2 style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Active Agents</h2>
          
          <div className="org-level level-boss" style={{ padding: '0 1rem' }}>
            {renderAgentCard(BOSS)}
          </div>
          
          <div className="org-level level-managers" style={{ padding: '0 1rem' }}>
            {MANAGERS.map(renderAgentCard)}
          </div>
          
          <div className="org-level level-workers" style={{ padding: '0 1rem' }}>
            {WORKERS.map(renderAgentCard)}
          </div>
        </div>

        {/* RIGHT: Kanban Board */}
        <div className="kanban-section" style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '1rem', padding: '1rem', height: 'calc(100vh - 140px)' }}>
          {['TODO', 'IN_PROGRESS', 'REVIEW', 'FINISHED'].map(column => {
            const colTasks = getTasksByColumn(column);
            const colTitles = {
              TODO: 'To Do (Plan)',
              IN_PROGRESS: 'In Progress (Execution)',
              REVIEW: 'Review / Analysis',
              FINISHED: 'Done'
            };
            const colColors = {
              TODO: '#64748b',
              IN_PROGRESS: '#0ea5e9',
              REVIEW: '#f59e0b',
              FINISHED: '#10b981'
            };

            return (
              <div key={column} className="kanban-column" style={{ minWidth: '280px' }}>
                <div className="kanban-column-header" style={{ borderBottomColor: colColors[column] }}>
                  <span style={{ color: colColors[column], fontWeight: 'bold' }}>{colTitles[column]}</span>
                  <span className="task-count" style={{ background: `${colColors[column]}22`, color: colColors[column] }}>{colTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {colTasks.length === 0 && <div className="text-muted" style={{fontSize:'0.85rem', textAlign:'center', marginTop:'1.5rem', fontStyle: 'italic'}}>No tasks</div>}
                  {colTasks.map(task => (
                    <div key={task.id} className="task-card" style={{ borderLeft: `3px solid ${colColors[column]}` }}>
                      <div className="task-title" style={{ fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{task.title}</div>
                      <div className="task-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Task #{task.id}</span>
                        {task.agent ? (
                          <div className="task-agent" style={{ color: task.agent.color, display: 'flex', alignItems: 'center', gap: '4px', background: `${task.agent.color}15`, padding: '2px 8px', borderRadius: '4px' }}>
                            <task.agent.icon size={12} />
                            {task.agent.name}
                          </div>
                        ) : (
                          column === 'FINISHED' ? <CheckCircle size={14} color="#10b981" /> : <Clock size={14} color="#64748b" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orchestration;
