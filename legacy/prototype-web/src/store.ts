import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserProfile = {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  goals: string[];
  activityLevel: string;
  planDuration: string;
  aiWelcomeMessage?: string;
  favoriteFoods?: string[];
  activityPrefs?: string[];
  email?: string;
  role?: string;
  lastCheckInDate?: string;
  targetWeightChange?: number; // e.g., -5 for lose 5kg, +2 for gain 2kg
  targetTimeframe?: string; // e.g., "2 months"
};

export type Habit = {
  id: string;
  name: string;
  completed: boolean;
  icon: string;
  isWaterHabit?: boolean;
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged: boolean;
  reason?: string;
};

export type WaterStep = {
  id: string;
  label: string;
  amount: number;
  completed: boolean;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string | number;
};

export type WorkoutPlan = {
  title: string;
  duration: string;
  intensity: string;
  calories: string;
  exercises: Exercise[];
};

export type DailyData = {
  date: string;
  readiness: number;
  sleepScore: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  waterConsumed: number;
  waterTarget: number;
  waterSteps: WaterStep[];
  habits: Habit[];
  meals: Meal[];
  workout?: WorkoutPlan;
  gems: number;
  badges: Badge[];
  dailyInsight?: string;
  nutritionInsight?: string;
};

interface AppState {
  user: UserProfile | null;
  isOnboarded: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAuthReady: boolean;
  language: string;
  dailyData: DailyData;
  setUser: (user: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  login: (isGuest?: boolean) => void;
  logout: () => void;
  setAuthReady: (ready: boolean) => void;
  setAuthenticatedUser: (isAuthenticated: boolean, isGuest?: boolean) => void;
  setLanguage: (lang: string) => void;
  updateDailyData: (data: Partial<DailyData>) => void;
  toggleHabit: (id: string) => void;
  toggleWaterStep: (id: string) => void;
  completeAllWater: () => void;
  addCustomWater: (amount: number) => void;
  addWater: (amount: number) => void; // legacy, keep for safety
  addGems: (amount: number) => void;
  logMeal: (mealId: string) => void;
  addCustomMeal: (meal: Omit<Meal, 'id' | 'logged'>) => void;
  replanMeals: (newMeals: Meal[]) => void;
  calculateTargets: () => void;
}

const defaultDailyData: DailyData = {
  date: new Date().toISOString().split('T')[0],
  readiness: 0,
  sleepScore: 0,
  caloriesConsumed: 0,
  caloriesTarget: 2000,
  proteinConsumed: 0,
  proteinTarget: 150,
  carbsConsumed: 0,
  carbsTarget: 200,
  fatConsumed: 0,
  fatTarget: 65,
  waterConsumed: 0,
  waterTarget: 2.0,
  waterSteps: [
    { id: 'w1', label: 'Morning', amount: 0.5, completed: false },
    { id: 'w2', label: 'Noon', amount: 0.5, completed: false },
    { id: 'w3', label: 'Afternoon', amount: 0.5, completed: false },
    { id: 'w4', label: 'Evening', amount: 0.5, completed: false },
  ],
  gems: 0,
  badges: [
    { id: 'water-warrior', name: 'Water Warrior', icon: 'droplets', unlocked: false },
    { id: 'consistency-king', name: 'Consistency King', icon: 'zap', unlocked: false },
    { id: 'balance-master', name: 'Balance Master', icon: 'scale', unlocked: false },
  ],
  habits: [
    { id: '1', name: 'Morning Sunlight', completed: false, icon: 'sun' },
    { id: '2', name: 'Meditation', completed: false, icon: 'brain' },
    { id: '3', name: 'Stretching', completed: false, icon: 'activity' },
  ],
  meals: [
    { id: 'm1', name: 'Oatmeal with Berries', calories: 350, protein: 12, carbs: 60, fat: 5, type: 'breakfast', logged: false },
    { id: 'm2', name: 'Grilled Chicken Salad', calories: 550, protein: 45, carbs: 20, fat: 15, type: 'lunch', logged: false },
    { id: 'm3', name: 'Salmon & Asparagus', calories: 600, protein: 40, carbs: 10, fat: 30, type: 'dinner', logged: false },
  ]
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,
      isAuthenticated: false,
      isGuest: false,
      isAuthReady: false,
      language: 'ja',
      dailyData: defaultDailyData,
      setUser: (userData) => {
        set((state) => ({ user: state.user ? { ...state.user, ...userData } : userData as UserProfile }));
        // Only calculate targets if we don't have AI-generated targets yet, or if explicitly needed.
        // For now, we let AI set the targets, but keep this as fallback.
        get().calculateTargets();
      },
      completeOnboarding: () => set({ isOnboarded: true }),
      login: (isGuest = false) => set({ isAuthenticated: true, isGuest }),
      logout: () => set({ 
        isAuthenticated: false, 
        isGuest: false, 
        user: null, 
        isOnboarded: false,
        dailyData: defaultDailyData 
      }),
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      setAuthenticatedUser: (isAuthenticated, isGuest = false) => set({ isAuthenticated, isGuest }),
      setLanguage: (lang) => set({ language: lang }),
      updateDailyData: (data) => set((state) => ({ dailyData: { ...state.dailyData, ...data } })),
      toggleHabit: (id) => {
        const habit = get().dailyData.habits.find(h => h.id === id);
        if (!habit?.completed) {
          get().addGems(5);
          if (habit?.isWaterHabit) {
            get().completeAllWater();
          }
        }
        set((state) => ({
          dailyData: {
            ...state.dailyData,
            habits: state.dailyData.habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h)
          }
        }));
      },
      toggleWaterStep: (id) => {
        const step = get().dailyData.waterSteps.find(s => s.id === id);
        if (!step) return;
        
        const isCompleting = !step.completed;
        if (isCompleting) get().addGems(2);

        set((state) => {
          const newSteps = state.dailyData.waterSteps.map(s => s.id === id ? { ...s, completed: isCompleting } : s);
          const newConsumed = newSteps.filter(s => s.completed).reduce((sum, s) => sum + s.amount, 0);
          return {
            dailyData: {
              ...state.dailyData,
              waterSteps: newSteps,
              waterConsumed: newConsumed
            }
          };
        });
      },
      completeAllWater: () => {
        set((state) => {
          const newSteps = state.dailyData.waterSteps.map(s => ({ ...s, completed: true }));
          const newConsumed = newSteps.reduce((sum, s) => sum + s.amount, 0);
          return {
            dailyData: {
              ...state.dailyData,
              waterSteps: newSteps,
              waterConsumed: newConsumed
            }
          };
        });
      },
      addCustomWater: (amount) => {
        get().addGems(2);
        set((state) => ({
          dailyData: {
            ...state.dailyData,
            waterConsumed: state.dailyData.waterConsumed + amount
          }
        }));
      },
      addWater: (amount) => {
        get().addGems(2);
        set((state) => ({
          dailyData: {
            ...state.dailyData,
            waterConsumed: Math.min(state.dailyData.waterTarget, state.dailyData.waterConsumed + amount)
          }
        }));
      },
      addGems: (amount) => set((state) => ({
        dailyData: { ...state.dailyData, gems: state.dailyData.gems + amount }
      })),
      logMeal: (mealId) => {
        const meal = get().dailyData.meals.find(m => m.id === mealId);
        if (meal && !meal.logged) {
          get().addGems(10);
          set((state) => ({
            dailyData: {
              ...state.dailyData,
              caloriesConsumed: state.dailyData.caloriesConsumed + meal.calories,
              proteinConsumed: state.dailyData.proteinConsumed + meal.protein,
              carbsConsumed: state.dailyData.carbsConsumed + meal.carbs,
              fatConsumed: state.dailyData.fatConsumed + meal.fat,
              meals: state.dailyData.meals.map(m => m.id === mealId ? { ...m, logged: true } : m)
            }
          }));
        }
      },
      addCustomMeal: (mealData) => {
        get().addGems(15); // Extra reward for manual logging
        const newMeal: Meal = {
          ...mealData,
          id: `custom-${Date.now()}`,
          logged: true
        };
        set((state) => ({
          dailyData: {
            ...state.dailyData,
            caloriesConsumed: state.dailyData.caloriesConsumed + newMeal.calories,
            proteinConsumed: state.dailyData.proteinConsumed + newMeal.protein,
            carbsConsumed: state.dailyData.carbsConsumed + newMeal.carbs,
            fatConsumed: state.dailyData.fatConsumed + newMeal.fat,
            meals: [...state.dailyData.meals, newMeal]
          }
        }));
      },
      replanMeals: (newMeals) => {
        get().addGems(20); // Reward for re-planning
        set((state) => ({
          dailyData: { ...state.dailyData, meals: newMeals }
        }));
      },
      calculateTargets: () => {
        const { user } = get();
        if (!user) return;

        // Mifflin-St Jeor Equation
        let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
        if (user.gender === 'male') bmr += 5;
        else bmr -= 161;

        const activityMultipliers: Record<string, number> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          'very active': 1.9
        };

        const tdee = bmr * (activityMultipliers[user.activityLevel] || 1.2);
        
        let targetCalories = tdee;
        if (user.goals.includes('fat-loss')) targetCalories -= 500;
        if (user.goals.includes('muscle')) targetCalories += 300;

        set((state) => ({
          dailyData: {
            ...state.dailyData,
            caloriesTarget: Math.round(targetCalories),
            proteinTarget: Math.round(user.weight * 1.8), // 1.8g per kg
            waterTarget: Math.round((user.weight * 0.035) * 10) / 10 // 35ml per kg
          }
        }));
      }
    }),
    {
      name: 'sooti-wellness-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1: ensure dailyData has badges and meals
          if (persistedState.dailyData) {
            persistedState.dailyData.badges = persistedState.dailyData.badges || defaultDailyData.badges;
            persistedState.dailyData.meals = persistedState.dailyData.meals || defaultDailyData.meals;
            persistedState.dailyData.gems = persistedState.dailyData.gems || 0;
          }
        }
        return persistedState;
      },
    }
  )
);


