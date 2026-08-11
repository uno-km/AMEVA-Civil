import React, { useState, useEffect, useRef } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';
import { Bot, Send, X, Cpu, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

const MODELS = [
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B (Fast & Light)' },
  { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', name: 'Llama 3.1 8B (High Performance)' }
];

export const AIAssistant: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'ready' | 'inferencing' | 'error'>('idle');
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const store = useProjectStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingState]);

  const loadModel = async () => {
    if (engine) {
      engine.unload();
      setEngine(null);
    }
    
    setLoadingState('loading');
    setProgressText('Initializing WebGPU Engine...');
    setProgressPercent(0);
    
    try {
      const initProgressCallback = (report: InitProgressReport) => {
        setProgressText(report.text);
        if (report.progress) {
          setProgressPercent(Math.round(report.progress * 100));
        }
      };

      // Create engine
      const newEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback,
      });
      
      setEngine(newEngine);
      setLoadingState('ready');
      setMessages(prev => [...prev, { role: 'assistant', content: 'AI Assistant is ready. I have access to your structural model data. How can I help you today?' }]);
    } catch (err) {
      console.error(err);
      setLoadingState('error');
      setProgressText('Failed to load model. Check console for details. Ensure WebGPU is enabled.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !engine || loadingState !== 'ready') return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoadingState('inferencing');

    // Create system prompt with current project context
    const contextStr = JSON.stringify({
      nodes: Object.keys(store.nodes).length,
      elements: Object.keys(store.elements).length,
      materials: Object.keys(store.materials).length,
      loadCases: Object.keys(store.loadCases).length,
      resultsAvailable: store.results ? true : false
    }, null, 2);

    const systemPrompt = `You are a professional Structural Engineering AI Assistant integrated into AMEVA-Civil.
You can review the user's structural model and answer questions.
Current Model Context:
${contextStr}
Respond directly, professionally, and concisely in the same language as the user.`;

    try {
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMessage }
      ];

      const reply = await engine.chat.completions.create({
        messages: apiMessages,
        temperature: 0.7,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: reply.choices[0].message.content || '' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred during inference.' }]);
    } finally {
      setLoadingState('ready');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      width: '400px',
      height: '600px',
      backgroundColor: 'rgba(20, 25, 35, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--accent)" />
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>WebLLM Assistant</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Model Selection & Status Panel */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loadingState === 'loading' || loadingState === 'inferencing'}
            style={{ flex: 1, padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff' }}
          >
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button 
            onClick={loadModel} 
            disabled={loadingState === 'loading' || loadingState === 'inferencing'}
            className="btn-primary" 
            style={{ padding: '8px 16px' }}
          >
            Load
          </button>
        </div>

        {/* AI Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          {loadingState === 'idle' && <><Cpu size={14} color="var(--text-secondary)" /> <span style={{ color: 'var(--text-secondary)' }}>Model not loaded</span></>}
          {loadingState === 'loading' && <><Loader2 size={14} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} /> <span style={{ color: 'var(--accent)' }}>Downloading Model... {progressPercent}%</span></>}
          {loadingState === 'ready' && <><CheckCircle2 size={14} color="#10b981" /> <span style={{ color: '#10b981', fontWeight: 600, textShadow: '0 0 8px rgba(16,185,129,0.4)' }}>Online (Ready)</span></>}
          {loadingState === 'inferencing' && <><Loader2 size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> <span style={{ color: '#f59e0b', fontWeight: 600, textShadow: '0 0 8px rgba(245,158,11,0.4)' }}>Inferencing...</span></>}
          {loadingState === 'error' && <><AlertTriangle size={14} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>Error Loading</span></>}
        </div>
        
        {loadingState === 'loading' && (
          <div style={{ marginTop: '8px', width: '100%', height: '4px', backgroundColor: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--accent)', transition: 'width 0.3s ease' }} />
          </div>
        )}
        {loadingState === 'loading' && progressText && (
          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {progressText}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && loadingState !== 'loading' && loadingState !== 'ready' && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '40px', fontSize: '0.9rem' }}>
            Select a model and click Load to initialize the AI Assistant.
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            backgroundColor: m.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
            border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {loadingState === 'inferencing' && (
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '10px 14px',
            borderRadius: '12px 12px 12px 0',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Loader2 size={16} color="var(--text-secondary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI about the model..."
          disabled={loadingState !== 'ready'}
          style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
        />
        <button 
          onClick={handleSend}
          disabled={loadingState !== 'ready' || !input.trim()}
          style={{ 
            width: '40px', height: '40px', borderRadius: '8px', border: 'none', 
            backgroundColor: (loadingState === 'ready' && input.trim()) ? 'var(--accent)' : 'var(--bg-border)', 
            color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            cursor: (loadingState === 'ready' && input.trim()) ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};
