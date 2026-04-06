import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { hash } from 'bcryptjs';
import { MealType, PrismaClient, UserRole, UserStatus } from '@prisma/client';

loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const prisma = new PrismaClient();

function startOfTodayUtc() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function ensureAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? 'Papipo Admin';

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be configured');
  }

  const passwordHash = await hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
      profile: {
        upsert: {
          update: { name, preferredLanguage: 'ja' },
          create: {
            name,
            preferredLanguage: 'ja'
          }
        }
      }
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          name,
          preferredLanguage: 'ja'
        }
      }
    }
  });

  return email;
}

async function ensureDemoUser() {
  const email = process.env.USER_SEED_EMAIL ?? 'demo@papipo.local';
  const password = process.env.USER_SEED_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.USER_SEED_NAME ?? 'Papipo Demo';
  const passwordHash = await hash(password, 10);
  const today = startOfTodayUtc();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      passwordHash
    },
    create: {
      email,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      name,
      age: 28,
      gender: 'OTHER',
      heightCm: 168,
      weightKg: 64,
      goals: ['fat-loss', 'better-sleep'],
      activityLevel: 'moderate',
      planDuration: '30 days',
      targetWeightChangeKg: -2,
      targetTimeframe: '30 days',
      preferredLanguage: 'ja',
      favoriteFoods: ['salmon', 'yogurt'],
      activityPrefs: ['walking', 'mobility'],
      aiWelcomeMessage:
        '基礎プランの準備ができました。回復、水分補給、そして安定した前進に集中していきましょう。',
      isOnboarded: true,
      lastCheckInDate: today
    },
    create: {
      userId: user.id,
      name,
      age: 28,
      gender: 'OTHER',
      heightCm: 168,
      weightKg: 64,
      goals: ['fat-loss', 'better-sleep'],
      activityLevel: 'moderate',
      planDuration: '30 days',
      targetWeightChangeKg: -2,
      targetTimeframe: '30 days',
      preferredLanguage: 'ja',
      favoriteFoods: ['salmon', 'yogurt'],
      activityPrefs: ['walking', 'mobility'],
      aiWelcomeMessage:
        '基礎プランの準備ができました。回復、水分補給、そして安定した前進に集中していきましょう。',
      isOnboarded: true,
      lastCheckInDate: today
    }
  });

  await prisma.dailyMetric.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: today
      }
    },
    update: {
      readiness: 78,
      sleepScore: 81,
      caloriesConsumed: 1260,
      caloriesTarget: 1880,
      proteinConsumed: 78,
      proteinTarget: 116,
      carbsConsumed: 132,
      carbsTarget: 190,
      fatConsumed: 42,
      fatTarget: 56,
      waterConsumedLiters: 1.5,
      waterTargetLiters: 2.4,
      gems: 18,
      dailyInsight: '安定した一日です。水分補給と夜の回復ルーティンを整えていきましょう。',
      nutritionInsight:
        'たんぱく質は順調です。摂りすぎない範囲で、もう1食バランスよく追加しましょう。'
    },
    create: {
      userId: user.id,
      date: today,
      readiness: 78,
      sleepScore: 81,
      caloriesConsumed: 1260,
      caloriesTarget: 1880,
      proteinConsumed: 78,
      proteinTarget: 116,
      carbsConsumed: 132,
      carbsTarget: 190,
      fatConsumed: 42,
      fatTarget: 56,
      waterConsumedLiters: 1.5,
      waterTargetLiters: 2.4,
      gems: 18,
      dailyInsight: '安定した一日です。水分補給と夜の回復ルーティンを整えていきましょう。',
      nutritionInsight:
        'たんぱく質は順調です。摂りすぎない範囲で、もう1食バランスよく追加しましょう。'
    }
  });

  await prisma.dailyCheckIn.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: today
      }
    },
    update: {
      sleepHours: 7.5,
      sleepQuality: 4,
      soreness: 2,
      stress: 2,
      readinessScore: 78,
      sleepScore: 81,
      insight: '回復マーカーは安定しています。食事を抜かず、整った一日を意識しましょう。'
    },
    create: {
      userId: user.id,
      date: today,
      sleepHours: 7.5,
      sleepQuality: 4,
      soreness: 2,
      stress: 2,
      readinessScore: 78,
      sleepScore: 81,
      insight: '回復マーカーは安定しています。食事を抜かず、整った一日を意識しましょう。'
    }
  });

  await prisma.badgeProgress.createMany({
    data: [
      { userId: user.id, code: 'water-warrior', progress: 1, unlocked: true },
      { userId: user.id, code: 'consistency-king', progress: 2, unlocked: false },
      { userId: user.id, code: 'balance-master', progress: 1, unlocked: false }
    ],
    skipDuplicates: true
  });

  const habits = [
    { name: '朝の日光', icon: 'sun', isWaterHabit: false },
    { name: '瞑想', icon: 'brain', isWaterHabit: false },
    { name: 'ストレッチ', icon: 'activity', isWaterHabit: false },
    { name: '水分チェック', icon: 'droplets', isWaterHabit: true }
  ];

  for (const habit of habits) {
    const existing = await prisma.habitDefinition.findFirst({
      where: { userId: user.id, name: habit.name }
    });
    const record = existing
      ? await prisma.habitDefinition.update({
          where: { id: existing.id },
          data: {
            icon: habit.icon,
            isWaterHabit: habit.isWaterHabit
          }
        })
      : await prisma.habitDefinition.create({
          data: {
            userId: user.id,
            name: habit.name,
            icon: habit.icon,
            isWaterHabit: habit.isWaterHabit
          }
        });

    await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: record.id,
          date: today
        }
      },
      update: {
        completed: habit.name != '瞑想'
      },
      create: {
        userId: user.id,
        habitId: record.id,
        date: today,
        completed: habit.name != '瞑想'
      }
    });
  }

  await prisma.mealPlan.deleteMany({
    where: { userId: user.id, date: today }
  });

  await prisma.mealPlan.createMany({
    data: [
      {
        userId: user.id,
        date: today,
        mealType: MealType.BREAKFAST,
        name: 'ギリシャヨーグルトボウル',
        calories: 420,
        protein: 28,
        carbs: 38,
        fat: 12,
        reason: '朝の食欲を安定させる高たんぱく朝食です。'
      },
      {
        userId: user.id,
        date: today,
        mealType: MealType.LUNCH,
        name: 'チキンライスボウル',
        calories: 610,
        protein: 42,
        carbs: 56,
        fat: 16,
        reason: '午後までエネルギーを安定させやすいバランス昼食です。'
      },
      {
        userId: user.id,
        date: today,
        mealType: MealType.DINNER,
        name: 'サーモングリーンプレート',
        calories: 520,
        protein: 36,
        carbs: 28,
        fat: 20,
        reason: '回復を支えるたんぱく質と良質な脂質の夕食です。'
      }
    ]
  });

  await prisma.mealLog.deleteMany({
    where: { userId: user.id, date: today, source: 'seed' }
  });

  await prisma.mealLog.createMany({
    data: [
      {
        userId: user.id,
        date: today,
        mealType: MealType.BREAKFAST,
        name: 'ギリシャヨーグルトボウル',
        calories: 420,
        protein: 28,
        carbs: 38,
        fat: 12,
        source: 'seed'
      }
    ]
  });

  const existingWorkout = await prisma.workoutPlan.findFirst({
    where: { userId: user.id, date: today }
  });

  if (existingWorkout) {
    await prisma.workoutExercise.deleteMany({
      where: { workoutPlanId: existingWorkout.id }
    });
    await prisma.workoutPlan.update({
      where: { id: existingWorkout.id },
      data: {
        title: '全身ファウンデーション',
        duration: '40 min',
        intensity: '中程度',
        calories: '320 kcal',
        completedAt: null
      }
    });
    await prisma.workoutExercise.createMany({
      data: [
        { workoutPlanId: existingWorkout.id, slug: 'goblet-squat', name: 'ゴブレットスクワット', sets: 3, reps: '12', position: 0 },
        { workoutPlanId: existingWorkout.id, slug: 'push-up', name: 'プッシュアップ', sets: 3, reps: '10', position: 1 },
        { workoutPlanId: existingWorkout.id, slug: 'dumbbell-row', name: 'ダンベルロウ', sets: 3, reps: '12', position: 2 },
        { workoutPlanId: existingWorkout.id, slug: 'front-plank', name: 'フロントプランク', sets: 3, reps: '45s', position: 3 }
      ]
    });
  } else {
    await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        date: today,
        title: '全身ファウンデーション',
        duration: '40 min',
        intensity: '中程度',
        calories: '320 kcal',
        exercises: {
          create: [
            { slug: 'goblet-squat', name: 'ゴブレットスクワット', sets: 3, reps: '12', position: 0 },
            { slug: 'push-up', name: 'プッシュアップ', sets: 3, reps: '10', position: 1 },
            { slug: 'dumbbell-row', name: 'ダンベルロウ', sets: 3, reps: '12', position: 2 },
            { slug: 'front-plank', name: 'フロントプランク', sets: 3, reps: '45s', position: 3 }
          ]
        }
      }
    });
  }

  return { email, password };
}

async function main() {
  const adminEmail = await ensureAdmin();
  const demoUser = await ensureDemoUser();

  console.log(`Admin user ensured: ${adminEmail}`);
  console.log(`Demo user ensured: ${demoUser.email}`);
  console.log(`Demo password: ${demoUser.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
