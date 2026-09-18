import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  HelpCircle,
  Code2,
  Check,
  Copy,
  Lightbulb,
  Zap,
  Puzzle,
  ListOrdered,
  Target,
  Trash2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { askTaskTutor } from '../../services/studyMaterialService';

/**
 * Helper to render lightweight markdown in tutor responses (headers, bold, lists, and code blocks).
 */
function FormattedTutorMessage({ text }) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-charcoal)' }}>
      {parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : '';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={pIdx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-beige)', margin: '4px 0' }}>
              {lang && (
                <div style={{ padding: '4px 10px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-beige)', color: 'var(--text-secondary)' }}>
                  {lang}
                </div>
              )}
              <pre style={{
                margin: 0,
                padding: '12px',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11.5px',
                overflowX: 'auto',
                lineHeight: '1.5'
              }}>
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Render paragraphs, headings, and bullet points
        const lines = part.split('\n');
        return (
          <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('### ')) {
                return (
                  <div key={lIdx} style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--accent-terracotta)', marginTop: '4px' }}>
                    {trimmed.replace(/^###\s*/, '')}
                  </div>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <div key={lIdx} style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '6px' }}>
                    {trimmed.replace(/^##\s*/, '')}
                  </div>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <div key={lIdx} style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-charcoal)', marginTop: '6px' }}>
                    {trimmed.replace(/^#\s*/, '')}
                  </div>
                );
              }

              // Bold items or bullet points
              const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
              const cleanContent = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

              return (
                <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: isBullet ? '6px' : '0' }}>
                  {isBullet && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)', marginTop: '8px', flexShrink: 0 }} />
                  )}
                  <span dangerouslySetInnerHTML={{
                    __html: cleanContent
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code style="background-color: var(--bg-card-subtle); color: var(--accent-terracotta); border: 1px solid var(--border-beige); padding: 2px 5px; border-radius: 4px; font-size: 11.5px; font-family: monospace;">$1</code>')
                  }} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * StudyTutor - Interactive AI Tutor inside the Study + Focus workspace.
 * Grounded strictly to the current task context with quick action pills and conversation history.
 */
export default function StudyTutor({
  task,
  material,
  onStartQuiz,
  activeCodeSnippet = null,
  onClearCodeSnippet = null
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll conversation to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // If activeCodeSnippet is provided from outside, automatically trigger code explanation
  useEffect(() => {
    if (activeCodeSnippet && typeof activeCodeSnippet === 'string') {
      handleSendQuery({
        actionType: 'explain_code',
        codeContext: activeCodeSnippet,
        displayPrompt: 'Explain this code line-by-line'
      });
    }
  }, [activeCodeSnippet]);

  const handleSendQuery = async ({ actionType = 'custom_query', codeContext = null, displayPrompt = null, customText = null }) => {
    const queryText = (customText || displayPrompt || inputValue).trim();
    if (!queryText && !codeContext && actionType === 'custom_query') return;

    setLastError(null);
    const userMsg = {
      role: 'user',
      text: displayPrompt || queryText || 'Explain this code',
      actionType
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const tutorPayload = {
        taskId: task?.id || task?.taskId,
        taskTitle: task?.name || task?.taskTitle || task?.topic || material?.title || 'Core Curriculum Concept',
        taskDescription: task?.description || task?.taskDescription || '',
        roadmapPhase: task?.phase || task?.roadmapPhase || '',
        roadmapTopic: task?.topic || task?.roadmapTopic || task?.name || material?.title || '',
        taskCategory: task?.category || task?.taskCategory || 'DSA',
        difficulty: task?.difficulty || 'Medium',
        learningObjectives: task?.learningObjectives || material?.learningObjectives || '',
        currentStudyMaterial: material || null,
        userQuery: queryText,
        actionType: actionType,
        codeContext: codeContext || activeCodeSnippet || '',
        conversationHistory: newHistory.map(m => ({ role: m.role, text: m.text })).slice(-4)
      };

      const result = await askTaskTutor(tutorPayload);

      if (result.success && result.answer) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: result.answer,
            actionType: result.actionType || actionType,
            isFallback: result.isFallback || false
          }
        ]);
      } else {
        throw new Error(result.error || 'Failed to receive answer');
      }
    } catch (err) {
      setLastError({
        message: err.message || "Couldn't generate a response. Try again.",
        retryParams: { actionType, codeContext, displayPrompt, customText: queryText }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery({ actionType: 'custom_query' });
    }
  };

  const handleCopyMessage = (text, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgIdx(idx);
      setTimeout(() => setCopiedMsgIdx(null), 2000);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastError(null);
    if (onClearCodeSnippet) onClearCodeSnippet();
  };

  const taskTopic = task?.topic || task?.roadmapTopic || task?.name || material?.title || 'this topic';

  return (
    <div
      id="sec-ask-tutor"
      className="study-tutor-container"
      style={{
        borderRadius: 'var(--radius-lg, 14px)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-beige)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(35, 25, 15, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}
    >
      {/* 1. TUTOR HEADER */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-beige)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'rgba(200, 90, 50, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-terracotta, #C85A32)'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-charcoal, #1E293B)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Ask NOVARA
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-terracotta-light)',
                color: 'var(--accent-terracotta)',
                border: '1px solid var(--border-accent)'
              }}>
                AI Tutor
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
              Interactive assistance strictly grounded in <strong>{taskTopic}</strong>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="btn-secondary"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              gap: '4px',
              borderRadius: '6px',
              minHeight: '26px',
              color: 'var(--text-muted, #94A3B8)'
            }}
            title="Clear tutor conversation"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* 2. ACTIVE CODE SNIPPET BANNER (if user clicked "Explain this code") */}
      {activeCodeSnippet && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#FFFDF0',
          borderBottom: '1px solid #FEEBC8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#744210'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={14} color="#D97706" />
            <span>Explaining selected code snippet</span>
          </div>
          {onClearCodeSnippet && (
            <button
              type="button"
              onClick={onClearCodeSnippet}
              style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 3. QUICK ACTION PILLS */}
      <div
        className="study-tutor-quick-actions"
        style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-card-subtle)',
          borderBottom: messages.length > 0 ? '1px solid var(--border-beige)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendQuery({ actionType: 'explain_simpler', displayPrompt: '✨ Explain simpler' })}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '12px', gap: '5px', borderRadius: 'var(--radius-pill, 20px)', minHeight: '44px', backgroundColor: 'var(--bg-card)', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
        >
          <Sparkles size={13} color="var(--accent-terracotta)" />
          <span>✨ Explain simpler</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendQuery({ actionType: 'another_example', displayPrompt: '💡 Give another example' })}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '12px', gap: '5px', borderRadius: 'var(--radius-pill, 20px)', minHeight: '44px', backgroundColor: 'var(--bg-card)', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
        >
          <Lightbulb size={13} color="var(--accent-amber)" />
          <span>💡 Give another example</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendQuery({ actionType: 'practice_problem', displayPrompt: '🧩 Give me a practice problem' })}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '12px', gap: '5px', borderRadius: 'var(--radius-pill, 20px)', minHeight: '44px', backgroundColor: 'var(--bg-card)', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
        >
          <Puzzle size={13} color="var(--accent-navy)" />
          <span>🧩 Practice problem</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendQuery({ actionType: 'step_by_step', displayPrompt: '🔍 Explain step-by-step' })}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '12px', gap: '5px', borderRadius: 'var(--radius-pill, 20px)', minHeight: '44px', backgroundColor: 'var(--bg-card)', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
        >
          <ListOrdered size={13} color="var(--accent-sage)" />
          <span>🔍 Step-by-step</span>
        </button>

        {onStartQuiz && (
          <button
            type="button"
            onClick={onStartQuiz}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              gap: '5px',
              borderRadius: 'var(--radius-pill, 20px)',
              minHeight: '44px',
              backgroundColor: '#F0FDF4',
              borderColor: '#BBF7D0',
              color: '#166534',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <Target size={13} color="#166534" />
            <span>🎯 Test me</span>
          </button>
        )}
      </div>

      {/* 4. CONVERSATION MESSAGE STREAM */}
      {messages.length > 0 && (
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '420px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card-subtle)'
        }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  gap: '4px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Message Header */}
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted, #94A3B8)', padding: '0 4px' }}>
                  {isUser ? 'You' : 'NOVARA Tutor'}
                </div>

                {/* Bubble Container */}
                <div
                  style={{
                    maxWidth: '92%',
                    padding: isUser ? '10px 14px' : '14px 16px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                    backgroundColor: isUser ? 'var(--accent-terracotta)' : 'var(--bg-card)',
                    color: isUser ? '#FFFFFF' : 'var(--text-charcoal)',
                    border: isUser ? 'none' : '1px solid var(--border-beige)',
                    fontSize: isUser ? '13px' : '13.5px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 3px rgba(35, 25, 15, 0.03)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {isUser ? (
                    <span>{msg.text}</span>
                  ) : (
                    <div>
                      <FormattedTutorMessage text={msg.text} />

                      {/* Message Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-beige)', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text, idx)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', gap: '4px', borderRadius: '4px', minHeight: '28px' }}
                        >
                          {copiedMsgIdx === idx ? <Check size={12} color="var(--accent-sage)" /> : <Copy size={12} />}
                          <span>{copiedMsgIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-beige)', borderRadius: '10px', width: 'fit-content' }}>
              <RefreshCw size={14} color="var(--accent-terracotta)" className="animate-spin" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                NOVARA is thinking...
              </span>
            </div>
          )}

          {/* Error Banner */}
          {lastError && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '12px',
              color: '#DC2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} color="#DC2626" />
                <span>{lastError.message}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendQuery(lastError.retryParams)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '11px', gap: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', color: '#DC2626', borderColor: 'rgba(239, 68, 68, 0.35)', minHeight: '32px' }}
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 5. INPUT BAR */}
      <div
        className="study-tutor-input-row"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-beige)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            disabled={isLoading}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${taskTopic}...`}
            style={{
              width: '100%',
              padding: '11px 14px',
              minHeight: '44px',
              boxSizing: 'border-box',
              borderRadius: 'var(--radius-pill, 24px)',
              border: '1px solid var(--border-beige)',
              backgroundColor: 'var(--bg-card-subtle)',
              fontSize: '13px',
              color: 'var(--text-charcoal)',
              outline: 'none',
              transition: 'border-color 150ms ease, box-shadow 150ms ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-terracotta)';
              e.target.style.boxShadow = '0 0 0 3px rgba(200, 90, 50, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-beige)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="button"
          disabled={isLoading || !inputValue.trim()}
          onClick={() => handleSendQuery({ actionType: 'custom_query' })}
          className="btn-primary"
          style={{
            padding: '10px 18px',
            minHeight: '44px',
            fontSize: '13px',
            fontWeight: 700,
            gap: '6px',
            borderRadius: 'var(--radius-pill, 24px)',
            opacity: (isLoading || !inputValue.trim()) ? 0.6 : 1,
            cursor: (isLoading || !inputValue.trim()) ? 'not-allowed' : 'pointer',
            flexShrink: 0
          }}
        >
          <span>Ask NOVARA</span>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
