import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ja: {
    translation: {
      nav: { today: '今日', workout: '運動', coach: 'AIコーチ', nutrition: '栄養', profile: 'プロフ' },
      auth: {
        welcome: 'Sooti Wellnessへようこそ',
        subtitle: 'あなたの健康の旅を始めましょう',
        login: 'ログイン',
        signup: '新規登録',
        email: 'メールアドレス',
        password: 'パスワード',
        forgot_password: 'パスワードをお忘れですか？',
        or_continue_with: 'または以下で続ける',
        guest_mode: 'ゲストとして続ける',
      },
      onboarding: {
        title: 'Sooti Wellness',
        subtitle: 'あなたに合わせてカスタマイズしましょう',
        name_prompt: 'お名前は何ですか？',
        goals_prompt: '主な目標は何ですか？',
        activity_prompt: '運動量はどのくらいですか？',
        next: '次へ',
        get_started: '始める',
        goals: { fat_loss: '脂肪燃焼', muscle: '筋肉増強', sleep: '睡眠改善', eat_clean: '健康的な食事' },
        activity: { sedentary: '座り仕事', light: '軽い運動', moderate: '適度な運動', active: '激しい運動' }
      },
      dashboard: {
        greeting: 'こんにちは、{{name}}さん',
        ready_prompt: '今日も頑張りましょう！',
        readiness: '準備完了度',
        sleep_score: '睡眠スコア',
        hydration: '水分補給',
        water_add: '+ 250ml 水を追加',
        daily_habits: '毎日の習慣',
        gems_earned: 'ジェム獲得！'
      },
      workout: {
        title: 'ワークアウト',
        subtitle: 'パーソナライズされたプラン',
        todays_plan: '今日のプラン',
        start_workout: 'ワークアウトを開始',
        exercises: 'エクササイズ'
      },
      nutrition: {
        title: '栄養',
        subtitle: '体にエネルギーを',
        left: '残り',
        protein: 'タンパク質',
        carbs: '炭水化物',
        fat: '脂質',
        todays_meals: '今日の食事',
        generate_plan: 'AI食事プランを作成',
        replan: 'プランを再調整',
        replan_desc: '今日は少し食べすぎましたか？AIにプランを調整してもらいましょう。',
        log_meal: '記録する',
        logged: '記録済み'
      },
      profile: {
        title: 'プロフィール',
        premium_member: 'プレミアムメンバー',
        activity: '運動量',
        goals: '目標',
        settings: '設定',
        personal_info: '個人情報',
        workout_prefs: 'ワークアウト設定',
        nutrition_allergies: '栄養とアレルギー',
        language: '言語 (Language)',
        sign_out: 'ログアウト',
        height: '身長',
        weight: '体重',
        age: '年齢',
        gender: '性別',
        male: '男性',
        female: '女性',
        other: 'その他',
        rewards: 'リワード',
        gems: 'ジェム',
        badges: 'バッジ'
      },
      coach: {
        title: 'AIコーチ',
        subtitle: 'いつでもサポートします',
        placeholder: '運動や食事について質問する...',
        send: '送信'
      }
    }
  },
  vi: {
    translation: {
      nav: { today: 'Hôm nay', workout: 'Tập luyện', coach: 'AI Coach', nutrition: 'Dinh dưỡng', profile: 'Hồ sơ' },
      auth: {
        welcome: 'Chào mừng đến Sooti Wellness',
        subtitle: 'Bắt đầu hành trình sức khỏe của bạn',
        login: 'Đăng nhập',
        signup: 'Đăng ký',
        email: 'Email',
        password: 'Mật khẩu',
        forgot_password: 'Quên mật khẩu?',
        or_continue_with: 'Hoặc tiếp tục với',
        guest_mode: 'Tiếp tục với tư cách Khách',
      },
      onboarding: {
        title: 'Sooti Wellness',
        subtitle: 'Cá nhân hóa hành trình của bạn',
        name_prompt: 'Chúng tôi nên gọi bạn là gì?',
        goals_prompt: 'Mục tiêu chính của bạn là gì?',
        activity_prompt: 'Mức độ vận động của bạn?',
        next: 'Tiếp theo',
        get_started: 'Bắt đầu',
        goals: { fat_loss: 'Giảm mỡ', muscle: 'Tăng cơ', sleep: 'Ngủ ngon hơn', eat_clean: 'Ăn sạch' },
        activity: { sedentary: 'Ít vận động', light: 'Vận động nhẹ', moderate: 'Vận động vừa', active: 'Rất năng động' }
      },
      dashboard: {
        greeting: 'Chào {{name}}',
        ready_prompt: 'Sẵn sàng cho ngày mới chưa?',
        readiness: 'Độ sẵn sàng',
        sleep_score: 'Điểm giấc ngủ',
        hydration: 'Bù nước',
        water_add: '+ 250ml Nước',
        daily_habits: 'Thói quen hàng ngày',
        gems_earned: 'Nhận được Gems!'
      },
      workout: {
        title: 'Tập luyện',
        subtitle: 'Kế hoạch của riêng bạn',
        todays_plan: 'Bài tập hôm nay',
        start_workout: 'Bắt đầu tập',
        exercises: 'Danh sách bài tập'
      },
      nutrition: {
        title: 'Dinh dưỡng',
        subtitle: 'Nạp năng lượng cho cơ thể',
        left: 'còn lại',
        protein: 'Chất đạm',
        carbs: 'Tinh bột',
        fat: 'Chất béo',
        todays_meals: 'Bữa ăn hôm nay',
        generate_plan: 'Tạo thực đơn AI',
        replan: 'Điều chỉnh kế hoạch',
        replan_desc: 'Hôm nay bạn lỡ ăn hơi nhiều? Hãy để AI điều chỉnh lại giúp bạn.',
        log_meal: 'Ghi nhận',
        logged: 'Đã ghi'
      },
      profile: {
        title: 'Hồ sơ',
        premium_member: 'Thành viên Premium',
        activity: 'Vận động',
        goals: 'Mục tiêu',
        settings: 'Cài đặt',
        personal_info: 'Thông tin cá nhân',
        workout_prefs: 'Tùy chọn tập luyện',
        nutrition_allergies: 'Dinh dưỡng & Dị ứng',
        language: 'Ngôn ngữ (Language)',
        sign_out: 'Đăng xuất',
        height: 'Chiều cao',
        weight: 'Cân nặng',
        age: 'Tuổi',
        gender: 'Giới tính',
        male: 'Nam',
        female: 'Nữ',
        other: 'Khác',
        rewards: 'Phần thưởng',
        gems: 'Gems',
        badges: 'Huy hiệu'
      },
      coach: {
        title: 'AI Coach',
        subtitle: 'Luôn ở đây vì bạn',
        placeholder: 'Hỏi về bài tập, bữa ăn...',
        send: 'Gửi'
      }
    }
  },
  en: {
    translation: {
      nav: { today: 'Today', workout: 'Workout', coach: 'AI Coach', nutrition: 'Nutrition', profile: 'Profile' },
      auth: {
        welcome: 'Welcome to Sooti Wellness',
        subtitle: 'Start your wellness journey',
        login: 'Log In',
        signup: 'Sign Up',
        email: 'Email',
        password: 'Password',
        forgot_password: 'Forgot Password?',
        or_continue_with: 'Or continue with',
        guest_mode: 'Continue as Guest',
      },
      onboarding: {
        title: 'Sooti Wellness',
        subtitle: 'Let\'s personalize your journey',
        name_prompt: 'What should we call you?',
        goals_prompt: 'What are your main goals?',
        activity_prompt: 'How active are you?',
        next: 'Next',
        get_started: 'Get Started',
        goals: { fat_loss: 'Lose Fat', muscle: 'Build Muscle', sleep: 'Better Sleep', eat_clean: 'Eat Clean' },
        activity: { sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', active: 'Very Active' }
      },
      dashboard: {
        greeting: 'Hi, {{name}}',
        ready_prompt: 'Ready to crush it today?',
        readiness: 'Readiness',
        sleep_score: 'Sleep Score',
        hydration: 'Hydration',
        water_add: '+ 250ml Water',
        daily_habits: 'Daily Habits',
        gems_earned: 'Gems Earned!'
      },
      workout: {
        title: 'Workout',
        subtitle: 'Your personalized plan',
        todays_plan: 'Today\'s Plan',
        start_workout: 'Start Workout',
        exercises: 'Exercises'
      },
      nutrition: {
        title: 'Nutrition',
        subtitle: 'Fuel your body',
        left: 'left',
        protein: 'Protein',
        carbs: 'Carbs',
        fat: 'Fat',
        todays_meals: 'Today\'s Meals',
        generate_plan: 'Generate AI Meal Plan',
        replan: 'Re-plan Day',
        replan_desc: 'Ate a bit too much today? Let AI adjust your remaining meals.',
        log_meal: 'Log',
        logged: 'Logged'
      },
      profile: {
        title: 'Profile',
        premium_member: 'Premium Member',
        activity: 'Activity',
        goals: 'Goals',
        settings: 'Settings',
        personal_info: 'Personal Info',
        workout_prefs: 'Workout Preferences',
        nutrition_allergies: 'Nutrition & Allergies',
        language: 'Language',
        sign_out: 'Sign Out',
        height: 'Height',
        weight: 'Weight',
        age: 'Age',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        rewards: 'Rewards',
        gems: 'Gems',
        badges: 'Badges'
      },
      coach: {
        title: 'AI Coach',
        subtitle: 'Always here for you',
        placeholder: 'Ask about workouts, meals...',
        send: 'Send'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
