import React, { useState } from 'react';
import { MessageSquare, Send, X, Activity, RefreshCw } from 'lucide-react';
import { testSlack, triggerFullReport } from '../services/api';

const HermesChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am Hermes, your ProCare AI assistant. How can I help you manage the pharmacy today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const lowerInput = input.toLowerCase();
      let responseText = '';

      if (lowerInput.includes('test slack')) {
        const res = await testSlack();
        responseText = res ? `✅ Slack test sent successfully! Result: ${JSON.stringify(res)}` : `❌ Failed to send Slack test.`;
      } 
      else if (lowerInput.includes('report') || lowerInput.includes('trigger')) {
        const res = await triggerFullReport();
        responseText = res ? `✅ Daily report triggered! It should appear in #managers-dashboard shortly.` : `❌ Failed to trigger report.`;
      }
      else {
        responseText = `(Mocked Response) I am querying the Obsidian RAG and the procaredev database regarding: "${input}". 
        Commands you can try: "test slack", "trigger daily report".`;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `❌ Error communicating with Hermes backend: ${e.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--primary-color)', color: 'white',
            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s', zIndex: 1000
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '380px', height: '550px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', background: 'linear-gradient(to right, rgba(14, 165, 233, 0.2), rgba(0, 212, 168, 0.1))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} color="white" />
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%', border: '2px solid #0f172a' }}></div>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'white', fontSize: '1rem' }}>Hermes AI</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online • Coordinator</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }} onMouseOver={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background='transparent'}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary-color), #0ea5e9)' : 'rgba(255,255,255,0.05)',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: 'white', padding: '0.75rem 1rem', borderRadius: msg.role === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.5',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
              }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '1rem 1rem 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={14} className="spin" /> Thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Hermes..."
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '2rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none', transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: input.trim() && !isTyping ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', 
                color: 'white', border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
};

export default HermesChat;
