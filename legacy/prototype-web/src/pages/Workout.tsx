import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Play, Dumbbell, Timer, Flame, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function Workout() {
  const { t } = useTranslation();
  const { dailyData } = useStore();
  
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  const defaultWorkout = {
    title: 'Full Body Sculpt',
    duration: '45 min',
    intensity: 'Moderate',
    calories: '320 kcal',
    exercises: [
      { name: 'Goblet Squats', sets: 3, reps: 12 },
      { name: 'Push-ups', sets: 3, reps: 10 },
      { name: 'Dumbbell Rows', sets: 3, reps: 12 },
      { name: 'Plank', sets: 3, reps: '45s' },
    ]
  };

  const todayWorkout = dailyData.workout || defaultWorkout;

  const handleExerciseClick = async (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    
    if (imageCache[exerciseName]) {
      setExerciseImage(imageCache[exerciseName]);
      return;
    }

    setIsGeneratingImage(true);
    setExerciseImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `A minimalist flat vector illustration of a person doing ${exerciseName}, clean background, fitness app style` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let base64Image = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64Image) {
        setExerciseImage(base64Image);
        setImageCache(prev => ({ ...prev, [exerciseName]: base64Image }));
      }
    } catch (error) {
      console.error("Error generating exercise image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">{t('workout.title')}</h1>
        <p className="text-[var(--color-text-muted)] font-medium">{t('workout.subtitle')}</p>
      </div>

      <ClayCard className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg-base)]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">{t('workout.todays_plan')}</span>
            <h2 className="text-xl font-extrabold mt-1">{todayWorkout.title}</h2>
          </div>
          <div className="w-12 h-12 rounded-full shadow-clay-inset flex items-center justify-center text-[var(--color-primary)]">
            <Dumbbell className="w-6 h-6" />
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-text-muted)]">
            <Timer className="w-4 h-4" /> {todayWorkout.duration}
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-[var(--color-text-muted)]">
            <Flame className="w-4 h-4" /> {todayWorkout.calories}
          </div>
        </div>

        <ClayButton variant="primary" className="w-full flex items-center justify-center gap-2">
          <Play className="w-5 h-5 fill-current" /> {t('workout.start_workout')}
        </ClayButton>
      </ClayCard>

      <div>
        <h3 className="font-bold text-lg mb-4 ml-2">{t('workout.exercises')}</h3>
        <div className="space-y-4">
          {todayWorkout.exercises.map((ex, i) => (
            <ClayCard 
              key={i} 
              className="p-4 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleExerciseClick(ex.name)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full shadow-clay-inset flex items-center justify-center font-bold text-[var(--color-text-muted)]">
                  {i + 1}
                </div>
                <span className="font-bold">{ex.name}</span>
              </div>
              <div className="text-sm font-bold text-[var(--color-text-muted)]">
                {ex.sets} x {ex.reps}
              </div>
            </ClayCard>
          ))}
        </div>
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <ClayCard className="w-full max-w-sm p-6 space-y-4 relative">
            <button 
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full shadow-clay-inset flex items-center justify-center text-[var(--color-text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-xl font-extrabold text-center pr-8">{selectedExercise}</h3>
            
            <div className="w-full aspect-square rounded-3xl shadow-clay-inset overflow-hidden bg-[var(--color-bg-base)] flex items-center justify-center">
              {isGeneratingImage ? (
                <div className="flex flex-col items-center gap-3 text-[var(--color-primary)]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold animate-pulse">Generating AI Illustration...</span>
                </div>
              ) : exerciseImage ? (
                <img src={exerciseImage} alt={selectedExercise} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-sm font-bold text-[var(--color-text-muted)]">Image not available</div>
              )}
            </div>
          </ClayCard>
        </div>
      )}
    </div>
  );
}
