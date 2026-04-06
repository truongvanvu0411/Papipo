import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type Meal } from '@/store';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayLinearProgress } from '@/components/ui/ClayProgress';
import { Utensils, Flame, Info, RefreshCw, CheckCircle2, Sparkles, Camera, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export function Nutrition() {
  const { t, i18n } = useTranslation();
  const { dailyData, logMeal, replanMeals, user, addCustomMeal } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const caloriesLeft = dailyData.caloriesTarget - dailyData.caloriesConsumed;
  const progress = (dailyData.caloriesConsumed / dailyData.caloriesTarget) * 100;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve) => {
        reader.onload = resolve;
      });
      const base64Data = (reader.result as string).split(',')[1];
      const mimeType = file.type;

      const targetLang = i18n.language === 'vi' ? 'Vietnamese' : i18n.language === 'ja' ? 'Japanese' : 'English';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `Analyze this food image. Estimate the nutritional values. Respond in ${targetLang}. Return a JSON object with: name (string, name of the food), calories (number), protein (number in grams), carbs (number in grams), fat (number in grams).` }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      addCustomMeal({
        name: data.name || 'Custom Meal',
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        type: 'snack'
      });
    } catch (error) {
      console.error("Error analyzing food image:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateMealPlan = async (isReplan = false) => {
    setIsGenerating(true);
    try {
      const prompt = isReplan 
        ? `The user has already consumed ${dailyData.caloriesConsumed} kcal today. Their daily target is ${dailyData.caloriesTarget} kcal. 
           Please adjust the remaining meals for the day to stay within the target. 
           User Profile: ${JSON.stringify(user)}. 
           Favorite foods: ${user?.favoriteFoods?.join(', ')}.
           Return a JSON array of 2-3 remaining meals.`
        : `Generate a full day meal plan (Breakfast, Lunch, Dinner, Snack) for a user with these targets: 
           Calories: ${dailyData.caloriesTarget}, Protein: ${dailyData.proteinTarget}g.
           User Profile: ${JSON.stringify(user)}.
           Favorite foods: ${user?.favoriteFoods?.join(', ')}.
           Return a JSON array of 4 meals.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
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
                type: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'type']
            }
          }
        }
      });

      const newMeals = JSON.parse(response.text || '[]') as Meal[];
      replanMeals(newMeals.map(m => ({ ...m, logged: false })));
    } catch (error) {
      console.error('AI Meal Plan Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">{t('nutrition.title')}</h1>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">{t('nutrition.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <ClayButton variant="secondary" className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-[var(--color-secondary)]" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzingImage}>
            {isAnalyzingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </ClayButton>
          <div className="w-12 h-12 rounded-full shadow-clay-inset bg-[var(--color-bg-base)] flex items-center justify-center text-[var(--color-secondary)]">
            <Utensils className="w-6 h-6" />
          </div>
        </div>
      </div>

      <ClayCard className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-4xl font-black text-[var(--color-text-main)]">{caloriesLeft}</span>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{t('nutrition.left')} kcal</p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-xl font-bold text-[var(--color-text-muted)]">{dailyData.caloriesConsumed}</span>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">/ {dailyData.caloriesTarget} kcal</p>
          </div>
        </div>
        <ClayLinearProgress value={dailyData.caloriesConsumed} max={dailyData.caloriesTarget} colorClass="bg-[var(--color-secondary)]" />
        
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">{t('nutrition.protein')}</p>
            <p className="font-bold text-sm">{dailyData.proteinConsumed}g <span className="text-[10px] text-[var(--color-text-muted)]">/ {dailyData.proteinTarget}g</span></p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">{t('nutrition.carbs')}</p>
            <p className="font-bold text-sm">{dailyData.carbsConsumed}g <span className="text-[10px] text-[var(--color-text-muted)]">/ {dailyData.carbsTarget}g</span></p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">{t('nutrition.fat')}</p>
            <p className="font-bold text-sm">{dailyData.fatConsumed}g <span className="text-[10px] text-[var(--color-text-muted)]">/ {dailyData.fatTarget}g</span></p>
          </div>
        </div>
      </ClayCard>

      {dailyData.nutritionInsight && (
        <ClayCard className="p-4 bg-green-50/50 border-green-100 border flex gap-3 items-start">
          <Info className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-green-900 leading-relaxed">
            {dailyData.nutritionInsight}
          </p>
        </ClayCard>
      )}

      {/* AI Re-plan Banner */}
      {dailyData.caloriesConsumed > dailyData.caloriesTarget * 0.7 && (
        <ClayCard className="p-4 bg-blue-50/50 border-blue-200 border flex gap-4 items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-blue-900">{t('nutrition.replan')}</h4>
            <p className="text-xs text-blue-700 leading-tight">{t('nutrition.replan_desc')}</p>
          </div>
          <ClayButton 
            variant="primary" 
            className="text-xs py-2 px-3 bg-blue-600" 
            onClick={() => generateMealPlan(true)}
            disabled={isGenerating}
          >
            {t('nutrition.replan')}
          </ClayButton>
        </ClayCard>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-lg">{t('nutrition.todays_meals')}</h3>
          <ClayButton 
            variant="icon" 
            className="rounded-full text-[var(--color-primary)]" 
            onClick={() => generateMealPlan(false)}
            disabled={isGenerating}
          >
            <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
          </ClayButton>
        </div>
        
        <div className="space-y-4">
          {(dailyData.meals || []).map((meal) => (
            <ClayCard key={meal.id} className={`p-4 flex items-center gap-4 transition-opacity ${meal.logged ? 'opacity-60' : ''}`}>
              <div className="w-12 h-12 rounded-2xl shadow-clay-inset flex items-center justify-center text-[var(--color-secondary)] bg-white">
                <Flame className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[var(--color-text-main)]">{meal.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{meal.type}</span>
                </div>
                <p className="text-xs font-bold text-[var(--color-text-muted)]">{meal.calories} kcal • {meal.protein}g {t('nutrition.protein')}</p>
                {meal.reason && <p className="text-[10px] text-[var(--color-primary)] font-medium mt-1 italic">✨ {meal.reason}</p>}
              </div>
              {meal.logged ? (
                <div className="text-green-500 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase">{t('nutrition.logged')}</span>
                </div>
              ) : (
                <ClayButton variant="secondary" className="text-xs py-2 px-4" onClick={() => logMeal(meal.id)}>
                  {t('nutrition.log_meal')}
                </ClayButton>
              )}
            </ClayCard>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-3xl text-orange-700 border border-orange-100">
        <Info className="w-5 h-5 shrink-0" />
        <p className="text-xs font-medium leading-relaxed">
          {t('nutrition.replan_desc')}
        </p>
      </div>
    </div>
  );
}
