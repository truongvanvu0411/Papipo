export type UserRole = 'ADMIN' | 'USER';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AuthProfileSummary {
  name: string | null;
  preferredLanguage: string | null;
  isOnboarded: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: AuthProfileSummary | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface RewardBadge {
  code: string;
  unlocked: boolean;
  progress: number;
}

export interface RewardSummary {
  gems: number;
  badges: RewardBadge[];
}

export interface HabitView {
  id: string;
  name: string;
  icon: string;
  isWaterHabit: boolean;
  completed: boolean;
}

export interface MealPlanView {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string | null;
}

export interface MealLogView {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string | null;
}

export interface WorkoutExerciseView {
  id: string;
  slug: string;
  name: string;
  sets: number;
  reps: string;
  position: number;
}

export interface WorkoutPlanView {
  id: string;
  title: string;
  duration: string;
  intensity: string;
  calories: string;
  completedAt: string | null;
  exercises: WorkoutExerciseView[];
}

export interface NutritionDayResponse {
  date: string;
  meals: MealPlanView[];
  mealLogs: MealLogView[];
  metrics: {
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
    carbsConsumed: number;
    carbsTarget: number;
    fatConsumed: number;
    fatTarget: number;
    nutritionInsight: string | null;
  };
}

export interface MealAnalysisResponse {
  analyzedMeal: MealLogView;
  summary: string;
  nutrition: NutritionDayResponse;
}

export interface MealReplanResponse extends NutritionDayResponse {
  replanSummary: string;
}

export interface WorkoutDayResponse {
  date: string;
  workout: WorkoutPlanView | null;
  completedToday: boolean;
}

export interface AiConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string | null;
}

export interface AiMessageView {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface AiChatResponse {
  conversation: AiConversationSummary;
  messages: AiMessageView[];
}

export interface DashboardResponse {
  date: string;
  profile: {
    name: string | null;
    preferredLanguage: string | null;
    aiWelcomeMessage: string | null;
    isOnboarded: boolean;
    goals: string[];
  } | null;
  metrics: {
    readiness: number | null;
    sleepScore: number | null;
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
    carbsConsumed: number;
    carbsTarget: number;
    fatConsumed: number;
    fatTarget: number;
    waterConsumedLiters: number;
    waterTargetLiters: number;
    dailyInsight: string | null;
    nutritionInsight: string | null;
    hasCompletedCheckInToday: boolean;
  };
  habits: HabitView[];
  meals: MealPlanView[];
  workout: WorkoutPlanView | null;
  rewards: RewardSummary;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    name: string | null;
    age: number | null;
    gender: Gender | null;
    heightCm: number | null;
    weightKg: number | null;
    goals: string[];
    activityLevel: string | null;
    planDuration: string | null;
    targetWeightChangeKg: number | null;
    targetTimeframe: string | null;
    preferredLanguage: string | null;
    favoriteFoods: string[];
    activityPrefs: string[];
    aiWelcomeMessage: string | null;
    isOnboarded: boolean;
    lastCheckInDate: string | null;
  } | null;
  rewards: RewardSummary;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  profile: {
    name: string | null;
    preferredLanguage: string | null;
    isOnboarded: boolean;
    goals: string[];
    activityLevel: string | null;
    planDuration: string | null;
  } | null;
  latestMetricDate: string | null;
}

export interface AdminDashboardOverview {
  totals: {
    users: number;
    activeUsers: number;
    suspendedUsers: number;
    admins: number;
  };
  recentUsers: AdminUserListItem[];
}

export interface AdminUserDetail {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  profile: {
    name: string | null;
    age: number | null;
    gender: string | null;
    heightCm: number | null;
    weightKg: number | null;
    goals: string[];
    activityLevel: string | null;
    planDuration: string | null;
    targetWeightChangeKg: number | null;
    targetTimeframe: string | null;
    preferredLanguage: string | null;
    favoriteFoods: string[];
    activityPrefs: string[];
    aiWelcomeMessage: string | null;
    isOnboarded: boolean;
    lastCheckInDate: string | null;
  } | null;
  latestMetric: {
    date: string;
    readiness: number | null;
    sleepScore: number | null;
    caloriesConsumed: number;
    caloriesTarget: number;
    waterConsumedLiters: number;
    waterTargetLiters: number;
    gems: number;
    dailyInsight: string | null;
  } | null;
  latestCheckIn: {
    date: string;
    sleepHours: number;
    sleepQuality: number;
    soreness: number;
    stress: number;
    readinessScore: number;
    sleepScore: number;
    insight: string | null;
  } | null;
  latestNutrition: {
    date: string;
    nutritionInsight: string | null;
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
  } | null;
  latestWorkout: {
    id: string;
    date: string;
    title: string;
    duration: string;
    intensity: string;
    calories: string;
    completedAt: string | null;
    exercises: WorkoutExerciseView[];
  } | null;
}

export interface AdminUserActivity {
  checkIns: Array<{
    id: string;
    date: string;
    readinessScore: number;
    sleepScore: number;
    insight: string | null;
  }>;
  mealLogs: Array<{
    id: string;
    date: string;
    name: string;
    calories: number;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    source?: string | null;
  }>;
  workouts: Array<{
    id: string;
    date: string;
    title: string;
    completedAt: string | null;
    exercises: WorkoutExerciseView[];
  }>;
  aiConversations: Array<{
    id: string;
    title: string | null;
    updatedAt: string;
    lastMessagePreview: string | null;
    messages: AiMessageView[];
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
}
