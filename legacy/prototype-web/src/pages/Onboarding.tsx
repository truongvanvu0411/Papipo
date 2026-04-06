import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, type UserProfile } from '@/store';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Activity, Target, Utensils, Moon, Calendar, Ruler, Weight, User, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { auth, db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, updateDailyData, completeOnboarding, language } = useStore();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 65,
    goals: [],
    activityLevel: 'moderate',
    planDuration: '30 days',
    targetWeightChange: -2,
    targetTimeframe: '30 days'
  });

  const generateAIPlan = async () => {
    setIsGenerating(true);
    
    const loadingTexts = [
      "Analyzing your body metrics...",
      "Calculating optimal macros...",
      "Designing your personalized habits...",
      "Crafting your meal plan...",
      "Finalizing your AI Coach setup..."
    ];
    
    let textIndex = 0;
    setLoadingText(loadingTexts[0]);
    const interval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[textIndex]);
    }, 1500);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const langMap: Record<string, string> = { vi: 'Vietnamese', ja: 'Japanese', en: 'English' };
      const targetLang = langMap[language] || 'English';

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert AI fitness coach. Create a personalized plan for this user:
          Name: ${profile.name}
          Age: ${profile.age}
          Gender: ${profile.gender}
          Height: ${profile.height} cm
          Weight: ${profile.weight} kg
          Goals: ${profile.goals?.join(', ')}
          Activity Level: ${profile.activityLevel}
          Plan Duration: ${profile.planDuration}
          Target Weight Change: ${profile.targetWeightChange} kg
          
          IMPORTANT: You MUST respond entirely in ${targetLang}. All generated text (habit names, meal names, welcome message, nutrition insight, workout details, water step labels) MUST be in ${targetLang}.
          
          Return a JSON object with:
          - targetCalories (number)
          - targetProtein (number)
          - targetCarbs (number)
          - targetFat (number)
          - targetWater (number in liters, e.g. 2.5)
          - waterSteps (array of 4-6 objects: { id: string, label: string (e.g. "Morning", "Before Lunch"), amount: number (in liters) })
          - habits (array of 3 objects: { id: string, name: string, icon: 'sun' | 'brain' | 'activity' | 'droplets', isWaterHabit: boolean (set to true if the habit is about drinking water) })
          - meals (array of 3 objects: { id: string, name: string, calories: number, protein: number, carbs: number, fat: number, type: 'breakfast' | 'lunch' | 'dinner' })
          - workout (object: { title: string, duration: string, intensity: string, calories: string, exercises: array of { name: string, sets: number, reps: string | number } })
          - welcomeMessage (string, a short encouraging message from the AI coach addressing the user by name and mentioning their goals and duration)
          - nutritionInsight (string, explaining the macro ratio and calorie deficit/surplus based on their weight goal and timeframe)
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              targetCalories: { type: Type.NUMBER },
              targetProtein: { type: Type.NUMBER },
              targetCarbs: { type: Type.NUMBER },
              targetFat: { type: Type.NUMBER },
              targetWater: { type: Type.NUMBER },
              waterSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    amount: { type: Type.NUMBER }
                  }
                }
              },
              habits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    isWaterHabit: { type: Type.BOOLEAN }
                  }
                }
              },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    type: { type: Type.STRING }
                  }
                }
              },
              workout: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  intensity: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.NUMBER },
                        reps: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              welcomeMessage: { type: Type.STRING },
              nutritionInsight: { type: Type.STRING }
            }
          }
        }
      });

      clearInterval(interval);
      
      if (response.text) {
        const data = JSON.parse(response.text);
        
        const userProfile = {
          ...profile,
          aiWelcomeMessage: data.welcomeMessage
        } as UserProfile;

        // Update user profile with welcome message
        setUser(userProfile);

        // Update daily data with AI generated targets and plans
        updateDailyData({
          caloriesTarget: data.targetCalories || 2000,
          proteinTarget: data.targetProtein || 150,
          carbsTarget: data.targetCarbs || 200,
          fatTarget: data.targetFat || 60,
          waterTarget: data.targetWater || 2.5,
          waterSteps: (data.waterSteps || []).map((s: any) => ({ ...s, completed: false })),
          habits: (data.habits || []).map((h: any) => ({ ...h, completed: false })),
          meals: (data.meals || []).map((m: any) => ({ ...m, logged: false })),
          workout: data.workout,
          nutritionInsight: data.nutritionInsight
        });

        if (auth.currentUser && !auth.currentUser.isAnonymous) {
          const userRole = auth.currentUser.email === 'vu24107@gmail.com' ? 'admin' : 'user';
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            ...userProfile,
            email: auth.currentUser.email,
            role: userRole,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        completeOnboarding();
        navigate('/');
      }
    } catch (error) {
      console.error("Failed to generate AI plan:", error);
      clearInterval(interval);
      setIsGenerating(false);
      alert("Failed to generate plan. Please try again.");
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      generateAIPlan();
    }
  };

  const toggleGoal = (goal: string) => {
    const goals = profile.goals || [];
    if (goals.includes(goal)) {
      setProfile({ ...profile, goals: goals.filter(g => g !== goal) });
    } else {
      setProfile({ ...profile, goals: [...goals, goal] });
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--color-text-main)]">Building Your Plan</h2>
          <p className="text-[var(--color-text-muted)] font-bold animate-pulse">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-[var(--color-text-main)]">{t('onboarding.title')}</h1>
          <p className="text-[var(--color-text-muted)] font-medium">Let's personalize your experience</p>
        </div>

        <ClayCard className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase ml-2">Name</label>
                  <input
                    type="text"
                    className="clay-input w-full mt-1"
                    placeholder="Your name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase ml-2">Age</label>
                    <input
                      type="number"
                      className="clay-input w-full mt-1"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase ml-2">Gender</label>
                    <select
                      className="clay-input w-full mt-1 bg-transparent"
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Body Metrics</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase ml-2">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                      type="number"
                      className="clay-input w-full pl-12"
                      value={profile.height}
                      onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase ml-2">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                      type="number"
                      className="clay-input w-full pl-12"
                      value={profile.weight}
                      onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">{t('onboarding.goals_prompt')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'fat-loss', label: t('onboarding.goals.fat_loss'), icon: Activity },
                  { id: 'muscle', label: t('onboarding.goals.muscle'), icon: Target },
                  { id: 'sleep', label: t('onboarding.goals.sleep'), icon: Moon },
                  { id: 'eat-clean', label: t('onboarding.goals.eat_clean'), icon: Utensils },
                ].map((goal) => {
                  const isSelected = profile.goals?.includes(goal.id);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-2xl cursor-pointer flex flex-col items-center text-center gap-2 transition-all ${
                        isSelected ? 'clay-panel text-[var(--color-primary)]' : 'clay-card text-[var(--color-text-muted)]'
                      }`}
                    >
                      <goal.icon className="w-6 h-6" />
                      <span className="font-bold text-sm">{goal.label}</span>
                    </div>
                  );
                })}
              </div>
              
              <h2 className="text-xl font-bold mt-6">{t('onboarding.activity_prompt')}</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sedentary', label: t('onboarding.activity.sedentary') },
                  { id: 'light', label: t('onboarding.activity.light') },
                  { id: 'moderate', label: t('onboarding.activity.moderate') },
                  { id: 'very active', label: t('onboarding.activity.active') }
                ].map((level) => (
                  <div
                    key={level.id}
                    onClick={() => setProfile({ ...profile, activityLevel: level.id })}
                    className={`p-3 rounded-2xl cursor-pointer text-center capitalize font-bold text-sm transition-all ${
                      profile.activityLevel === level.id ? 'clay-panel text-[var(--color-primary)]' : 'clay-card text-[var(--color-text-muted)]'
                    }`}
                  >
                    {level.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-bold">Plan Duration</h2>
              <p className="text-sm text-[var(--color-text-muted)] font-bold">How long do you want this plan to last?</p>
              <div className="space-y-4">
                {[
                  { id: '14 days', label: '14 Days Kickstart' },
                  { id: '30 days', label: '30 Days Challenge' },
                  { id: '8 weeks', label: '8 Weeks Transformation' },
                  { id: '12 weeks', label: '12 Weeks Lifestyle Change' }
                ].map((duration) => (
                  <div
                    key={duration.id}
                    onClick={() => setProfile({ ...profile, planDuration: duration.id, targetTimeframe: duration.id })}
                    className={`p-4 rounded-2xl cursor-pointer text-center font-bold transition-all ${
                      profile.planDuration === duration.id ? 'clay-panel text-[var(--color-primary)]' : 'clay-card text-[var(--color-text-muted)]'
                    }`}
                  >
                    {duration.label}
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-bold mt-6">Target Weight Change</h2>
              <p className="text-sm text-[var(--color-text-muted)] font-bold">What is your specific weight goal?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: -5, label: 'Lose 5kg' },
                  { id: -2, label: 'Lose 2kg' },
                  { id: 0, label: 'Maintain' },
                  { id: 2, label: 'Gain 2kg' },
                  { id: 5, label: 'Gain 5kg' }
                ].map((weight) => (
                  <div
                    key={weight.id}
                    onClick={() => setProfile({ ...profile, targetWeightChange: weight.id })}
                    className={`p-3 rounded-2xl cursor-pointer text-center font-bold text-sm transition-all ${
                      profile.targetWeightChange === weight.id ? 'clay-panel text-[var(--color-primary)]' : 'clay-card text-[var(--color-text-muted)]'
                    }`}
                  >
                    {weight.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${step >= i ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)]/30'}`} />
              ))}
            </div>
            <ClayButton variant="primary" onClick={handleNext} disabled={step === 1 && !profile.name}>
              {step === 4 ? 'Generate AI Plan' : t('onboarding.next')}
            </ClayButton>
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
