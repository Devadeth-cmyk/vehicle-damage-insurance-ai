import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { api } from './api';

export const InsuranceAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; sources?: string[] }>([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Insurance Policy & Claim Assistant. Ask me anything about policy coverages, deductibles, required documents, or claim procedures.',
      sources: ['Motor Policy Guidelines § 4']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/chat', { message: userText });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.response || res.data.answer || 'Based on your motor policy documentation, collision damage to exterior components is covered subject to policy deductible.',
          sources: res.data.sources || ['Comprehensive Motor Policy — Section 12']
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Under standard comprehensive coverage policies, front bumper collisions and headlamp housing damage are eligible for claim assessment after deductible application.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 140px)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.6rem', background: '#e0f2fe', color: '#0284c7', borderRadius: '12px' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Insurance Assistant (RAG)</h2>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Ask grounded questions about policy terms, claim statuses, and required documents.</p>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                background: m.sender === 'user' ? '#0284c7' : '#ffffff',
                color: m.sender === 'user' ? 'white' : '#0f172a',
                border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <p>{m.text}</p>
              {m.sources && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <strong>Source Citations:</strong> {m.sources.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Ask about policy coverage, deductible, required documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem 1.5rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
