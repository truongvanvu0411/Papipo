import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export function AICoach() {
  const { t } = useTranslation();
  const { user, dailyData } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: `Hi ${user?.name || 'there'}! I'm your Sooti AI Coach. How are you feeling today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context
      const context = `
        User Profile: ${JSON.stringify(user)}
        Today's Data: Readiness ${dailyData.readiness}/100, Sleep ${dailyData.sleepScore}/100.
        You are a supportive, knowledgeable wellness and fitness coach. Keep answers concise, friendly, and actionable.
        Reply in the user's preferred language.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nUser: ${userMsg.text}`,
      });

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'Sorry, I could not process that.',
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Oops, something went wrong connecting to my brain. Try again later!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full shadow-clay-inset bg-[var(--color-bg-base)] flex items-center justify-center text-[var(--color-primary)]">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">{t('coach.title')}</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">{t('coach.subtitle')}</p>
        </div>
      </div>

      <ClayCard inset className="flex-1 overflow-y-auto p-4 mb-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-[var(--color-primary)] text-white rounded-br-sm shadow-md' 
                : 'bg-[var(--color-surface)] text-[var(--color-text-main)] rounded-bl-sm shadow-clay-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-surface)] p-4 rounded-3xl rounded-bl-sm shadow-clay-sm flex gap-2">
              <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ClayCard>

      <div className="flex gap-3">
        <input
          type="text"
          className="clay-input flex-1"
          placeholder={t('coach.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <ClayButton variant="primary" className="px-4" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="w-5 h-5" />
        </ClayButton>
      </div>
    </div>
  );
}
