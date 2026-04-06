import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';
import { useStore } from '@/store';
import { auth, db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Loader2, Moon, Zap, Activity } from 'lucide-react';

export function InitialCheckInModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user, setUser, updateDailyData, language } = useStore();
  const [options, setOptions] = useState<{ id: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const langMap: Record<string, string> = { vi: 'Vietnamese', ja: 'Japanese', en: 'English' };
        const targetLang = langMap[language] || 'English';

        const prompt = `You are an AI fitness coach. The user just joined the app. 
          Generate 3 realistic options describing how they might feel today (sleep quality, energy level, mood).
          IMPORTANT: Respond entirely in ${targetLang}.
          Return a JSON object with:
          {
            "options": [
              { "id": "1", "text": "Option 1 text..." },
              { "id": "2", "text": "Option 2 text..." },
              { "id": "3", "text": "Option 3 text..." }
            ]
          }`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        if (response.text) {
          const data = JSON.parse(response.text);
          setOptions(data.options);
        }
      } catch (error) {
        console.error("Error generating options:", error);
        // Fallback options
        setOptions([
          { id: '1', text: 'I slept great and feel full of energy!' },
          { id: '2', text: 'I slept okay, feeling normal today.' },
          { id: '3', text: 'I did not sleep well and feel quite tired.' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [language]);

  const handleSelect = async (text: string) => {
    setEvaluating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const langMap: Record<string, string> = { vi: 'Vietnamese', ja: 'Japanese', en: 'English' };
      const targetLang = langMap[language] || 'English';

      const prompt = `User selected this status: "${text}".
        Evaluate their sleepScore (0-100) and readinessScore (0-100), and provide a short daily insight/advice (1 sentence).
        IMPORTANT: The insight MUST be in ${targetLang}.
        Return a JSON object with:
        {
          "sleepScore": number,
          "readinessScore": number,
          "dailyInsight": "string"
        }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        const today = new Date().toISOString().split('T')[0];
        
        updateDailyData({
          sleepScore: data.sleepScore,
          readiness: data.readinessScore,
          dailyInsight: data.dailyInsight
        });

        setUser({ lastCheckInDate: today });

        if (auth.currentUser && !auth.currentUser.isAnonymous) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            lastCheckInDate: today
          }, { merge: true });
        }
        
        onClose();
      }
    } catch (error) {
      console.error("Error evaluating status:", error);
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <ClayCard className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full shadow-clay-inset flex items-center justify-center bg-[var(--color-bg-base)]">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-main)]">First Day Check-in</h2>
          <p className="text-[var(--color-text-muted)] font-bold text-sm">How are you feeling today?</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm font-bold text-[var(--color-text-muted)] animate-pulse">AI is analyzing your profile...</p>
          </div>
        ) : evaluating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm font-bold text-[var(--color-text-muted)] animate-pulse">Calculating your scores...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((opt) => (
              <ClayButton 
                key={opt.id} 
                variant="secondary" 
                className="w-full text-left p-4 h-auto whitespace-normal leading-relaxed font-bold"
                onClick={() => handleSelect(opt.text)}
              >
                {opt.text}
              </ClayButton>
            ))}
          </div>
        )}
      </ClayCard>
    </div>
  );
}
