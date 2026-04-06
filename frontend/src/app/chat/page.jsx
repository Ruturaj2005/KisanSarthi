'use client';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const VOICE_LOCALE = { hi: 'hi-IN', mr: 'mr-IN', pa: 'pa-IN', te: 'te-IN', ta: 'ta-IN', en: 'en-IN' };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = VOICE_LOCALE[lang] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => { setIsRecording(false); };
    recognition.onerror = () => { setIsRecording(false); };
    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LOCALE[lang] || 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/advisory/chat', { query: text, type: 'general' });
      const ai = data.data.advisory;
      const aiMsg = {
        role: 'ai',
        content: ai.advice,
        steps: ai.steps,
        urgency: ai.urgency,
        confidence: ai.confidence,
        sources: ai.sources,
        warnings: ai.warnings,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages((prev) => [...prev, {
        role: 'ai', content: 'Sorry, I could not process your request. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = t.chat.quickPrompts;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <h1 className="text-lg font-bold text-ink">KisanSaathi AI</h1>
              <p className="text-xs text-leaf">Online · Ready to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <span className="text-6xl mb-4">🌾</span>
            <h2 className="text-xl font-bold text-ink mb-2">KisanSaathi AI</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">{t.chat.placeholder}</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="px-4 py-2 rounded-full bg-forest/5 text-forest text-sm font-medium hover:bg-forest/10 transition-all border border-forest/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} px-4 py-3 shadow-sm`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.steps?.length > 0 && (
                <ol className="mt-3 space-y-1.5">
                  {msg.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-forest/10 text-forest text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              {msg.urgency && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant={msg.urgency}>{msg.urgency} urgency</Badge>
                  {msg.confidence && (
                    <Badge variant="forest">{Math.round(msg.confidence * 100)}% confidence</Badge>
                  )}
                </div>
              )}
              {msg.warnings?.length > 0 && (
                <div className="mt-2 p-2 bg-caution/10 rounded-lg">
                  {msg.warnings.map((w, j) => (
                    <p key={j} className="text-xs text-yellow-800">⚠️ {w}</p>
                  ))}
                </div>
              )}
              {msg.role === 'ai' && (
                <button
                  onClick={() => speakText(msg.content)}
                  className="mt-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Play audio"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm mb-16 md:mb-0">
        <div className="flex items-center gap-2">
          {/* Voice Input */}
          <button
            onClick={isRecording ? stopVoiceInput : startVoiceInput}
            className={`p-3 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center transition-all
              ${isRecording ? 'bg-danger text-white animate-pulse-slow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t.chat.placeholder}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 text-sm"
            disabled={loading}
          />

          <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} variant="primary" size="icon" aria-label="Send message">
            📤
          </Button>
        </div>
      </div>
    </div>
  );
}
