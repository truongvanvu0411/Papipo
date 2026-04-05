import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from '@google/genai';
import { useStore } from '@/store';
import { auth, db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Loader2, Moon, Activity, Brain, Dumbbell } from 'lucide-react';

export function DailyCheckInModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user, setUser, updateDailyData, language } = useStore();
  const [evaluating, setEvaluating] = useState(false);
  
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [stress, setStress] = useState(3);

  const handleSubmit = async () => {
    setEvaluating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const langMap: Record<string, string> = { vi: 'Vietnamese', ja: 'Japanese', en: 'English' };
      const targetLang = langMap[language] || 'English';

      const prompt = `User daily check-in data:
        - Sleep hours: ${sleepHours}h
        - Sleep quality: ${sleepQuality}/5 (1 is worst, 5 is best)
        - Muscle soreness: ${soreness}/5 (1 is no pain, 5 is very sore)
        - Stress level: ${stress}/5 (1 is relaxed, 5 is very stressed)
        
        Evaluate their sleepScore (0-100) and readinessScore (0-100), and provide a short daily insight/advice (1-2 sentences).
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
      console.error("Error evaluating daily status:", error);
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <ClayCard className="w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full shadow-clay-inset flex items-center justify-center bg-[var(--color-bg-base)]">
            <Moon className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-main)]">Daily Check-in</h2>
          <p className="text-[var(--color-text-muted)] font-bold text-sm">Let's see how ready you are today</p>
        </div>

        {evaluating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm font-bold text-[var(--color-text-muted)] animate-pulse">AI is calculating your scores...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center justify-between font-bold text-sm text-[var(--color-text-main)]">
                <span className="flex items-center gap-2"><Moon className="w-4 h-4" /> Sleep Hours</span>
                <span>{sleepHours}h</span>
              </label>
              <input 
                type="range" min="3" max="12" step="0.5" 
                value={sleepHours} onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between font-bold text-sm text-[var(--color-text-main)]">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Sleep Quality (1-5)</span>
                <span>{sleepQuality}</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" 
                value={sleepQuality} onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between font-bold text-sm text-[var(--color-text-main)]">
                <span className="flex items-center gap-2"><Dumbbell className="w-4 h-4" /> Muscle Soreness (1-5)</span>
                <span>{soreness}</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" 
                value={soreness} onChange={(e) => setSoreness(parseInt(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between font-bold text-sm text-[var(--color-text-main)]">
                <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> Stress Level (1-5)</span>
                <span>{stress}</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" 
                value={stress} onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            <ClayButton variant="primary" className="w-full py-4 text-lg" onClick={handleSubmit}>
              Analyze My Day
            </ClayButton>
          </div>
        )}
      </ClayCard>
    </div>
  );
}
