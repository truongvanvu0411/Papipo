import 'package:flutter/widgets.dart';

class PapipoStrings {
  PapipoStrings(this.languageCode);

  final String languageCode;

  static PapipoStrings of(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode;
    return PapipoStrings(code);
  }

  bool get isJa => languageCode == 'ja';
  bool get isVi => languageCode == 'vi';

  String get appTitle => 'Sooti Wellness';

  String get authSubtitle => isJa
      ? 'あなただけのウェルネスプランを続けましょう。'
      : isVi
          ? 'Tiếp tục hành trình chăm sóc sức khỏe cá nhân hóa của bạn.'
          : 'Sign in to continue your personalized wellness plan.';
  String get login => isJa ? 'ログイン' : isVi ? 'Đăng nhập' : 'Login';
  String get signUp => isJa ? '登録' : isVi ? 'Đăng ký' : 'Sign up';
  String get emailLabel => isJa ? 'メール' : isVi ? 'Email' : 'EMAIL';
  String get passwordLabel => isJa ? 'パスワード' : isVi ? 'Mật khẩu' : 'PASSWORD';
  String get nameLabel => isJa ? '名前' : isVi ? 'Tên' : 'NAME';
  String get nameHint => isJa ? 'お名前を入力' : isVi ? 'Nhập tên của bạn' : 'Your name';
  String get emailHint => 'you@example.com';
  String get passwordHint => isJa ? '8文字以上' : isVi ? 'Ít nhất 8 ký tự' : 'At least 8 characters';
  String get needAccount => isJa ? 'アカウントをお持ちでないですか？' : isVi ? 'Chưa có tài khoản?' : 'Need an account?';
  String get alreadyHaveAccount =>
      isJa ? 'すでにアカウントをお持ちですか？' : isVi ? 'Đã có tài khoản?' : 'Already have an account?';
  String get continueLabel => isJa ? '続ける' : isVi ? 'Tiếp tục' : 'Continue';
  String get createAccount => isJa ? 'アカウント作成' : isVi ? 'Tạo tài khoản' : 'Create account';
  String get createAccountSubtitle => isJa
      ? 'ガイド付きルーティンを始めるためにアカウントを作成しましょう。'
      : isVi
          ? 'Tạo tài khoản để bắt đầu lộ trình được hướng dẫn.'
          : 'Create your account to start your guided routine.';
  String get authGenericError =>
      isJa ? '今は続行できません。' : isVi ? 'Hiện tại chưa thể tiếp tục.' : 'Unable to continue right now.';
  String get authNameRequired =>
      isJa ? 'お名前を入力してください。' : isVi ? 'Vui lòng nhập tên của bạn' : 'Please tell us your name';
  String get authEmailInvalid =>
      isJa ? '有効なメールアドレスを入力してください。' : isVi ? 'Nhập email hợp lệ' : 'Enter a valid email';
  String get authPasswordInvalid =>
      isJa ? '8文字以上で入力してください。' : isVi ? 'Dùng ít nhất 8 ký tự' : 'Use at least 8 characters';

  String get onboardingSubtitle => isJa
      ? 'あなたに合わせて体験を整えましょう'
      : isVi
          ? 'Hãy cá nhân hóa trải nghiệm của bạn'
          : 'Let\'s personalize your experience';
  String get basicInformation => isJa ? '基本情報' : isVi ? 'Thông tin cơ bản' : 'Basic Information';
  String get bodyMetrics => isJa ? '身体データ' : isVi ? 'Chỉ số cơ thể' : 'Body Metrics';
  String get goalsAndActivity => isJa ? '目標と活動' : isVi ? 'Mục tiêu & hoạt động' : 'Goals & Activity';
  String get planSetup => isJa ? 'プラン設定' : isVi ? 'Thiết lập kế hoạch' : 'Plan Setup';
  String get ageLabel => isJa ? '年齢' : isVi ? 'Tuổi' : 'AGE';
  String get genderLabel => isJa ? '性別' : isVi ? 'Giới tính' : 'GENDER';
  String get heightLabel => isJa ? '身長' : isVi ? 'Chiều cao' : 'HEIGHT';
  String get weightLabel => isJa ? '体重' : isVi ? 'Cân nặng' : 'WEIGHT';
  String get next => isJa ? '次へ' : isVi ? 'Tiếp' : 'Next';
  String get back => isJa ? '戻る' : isVi ? 'Quay lại' : 'Back';
  String get createPlan => isJa ? 'プラン作成' : isVi ? 'Tạo kế hoạch' : 'Create plan';
  String get language => isJa ? '言語' : isVi ? 'Ngôn ngữ' : 'Language';
  String get bodyMetricsHelp => isJa
      ? 'この情報を使って、カロリー目標、水分計画、最初のトレーニングを作成します。'
      : isVi
          ? 'Thông tin này được dùng để tạo mục tiêu calo, kế hoạch nước và buổi tập đầu tiên.'
          : 'We use these metrics to generate your calorie target, hydration plan, and first training day.';
  String get goalsHelp => isJa
      ? '今いちばん大切にしたい結果を選んでください。'
      : isVi
          ? 'Hãy chọn kết quả quan trọng nhất với bạn lúc này.'
          : 'Choose the outcomes that matter most right now.';
  String get activityLevel => isJa ? '活動レベル' : isVi ? 'Mức hoạt động' : 'Activity level';
  String get planDuration => isJa ? '期間' : isVi ? 'Thời lượng kế hoạch' : 'Plan duration';
  String get weightGoal => isJa ? '体重目標' : isVi ? 'Mục tiêu cân nặng' : 'Weight goal';
  String get onboardingInvalidName =>
      isJa ? '名前を入力してください。' : isVi ? 'Vui lòng nhập tên.' : 'Please enter your name.';
  String get onboardingInvalidAge =>
      isJa ? '有効な年齢を入力してください。' : isVi ? 'Vui lòng nhập tuổi hợp lệ.' : 'Please enter a valid age.';
  String get onboardingInvalidHeight =>
      isJa ? '有効な身長を入力してください。' : isVi ? 'Vui lòng nhập chiều cao hợp lệ.' : 'Please enter a valid height.';
  String get onboardingInvalidWeight =>
      isJa ? '有効な体重を入力してください。' : isVi ? 'Vui lòng nhập cân nặng hợp lệ.' : 'Please enter a valid weight.';
  String get onboardingFinishError => isJa
      ? 'オンボーディングを完了できませんでした。'
      : isVi
          ? 'Không thể hoàn tất onboarding.'
          : 'Unable to finish onboarding.';

  String greeting(String name) => isJa
      ? 'こんにちは、$name'
      : isVi
          ? 'Xin chào, $name'
          : 'Hi, $name';
  String get readySubtitle => isJa
      ? '今日の次のヘルシーステップへ進みましょう。'
      : isVi
          ? 'Sẵn sàng cho bước khỏe mạnh tiếp theo hôm nay chưa?'
          : 'Ready for your next healthy step today?';
  String get aiCoachMessage => isJa ? 'AIコーチからのメッセージ' : isVi ? 'Tin nhắn từ AI Coach' : 'Message from AI Coach';
  String get readiness => isJa ? '準備度' : isVi ? 'Sẵn sàng' : 'READINESS';
  String get sleepScore => isJa ? '睡眠スコア' : isVi ? 'Điểm ngủ' : 'SLEEP SCORE';
  String get hydration => isJa ? '水分補給' : isVi ? 'Hydration' : 'Hydration';
  String get drinkAll => isJa ? 'まとめて記録' : isVi ? 'Uống hết' : 'Drink All';
  String get dailyHabits => isJa ? '今日の習慣' : isVi ? 'Thói quen hằng ngày' : 'Daily habits';
  String get howFeeling => isJa ? '今日の気分は？' : isVi ? 'Hôm nay bạn cảm thấy thế nào?' : 'How are you feeling?';
  String get submitCheckIn => isJa ? 'チェックイン送信' : isVi ? 'Gửi check-in' : 'Submit check-in';
  String get dailyCheckIn => isJa ? 'デイリーチェックイン' : isVi ? 'Daily check-in' : 'Daily check-in';
  String get quickCheckIn => isJa ? 'クイックチェックイン' : isVi ? 'Quick check-in' : 'Quick check-in';
  String get completed => isJa ? '完了' : isVi ? 'Hoàn tất' : 'Completed';
  String get addCustomWater => isJa ? '水分を追加' : isVi ? 'Thêm nước' : 'Add custom water';
  String get amountInLiters => isJa ? 'リットル量' : isVi ? 'Lượng nước (lít)' : 'Amount in liters';
  String get addWater => isJa ? '水分を追加' : isVi ? 'Thêm nước' : 'Add water';
  String get save => isJa ? '保存' : isVi ? 'Lưu' : 'Save';
  String get sleepHours => isJa ? '睡眠時間' : isVi ? 'Số giờ ngủ' : 'Sleep hours';
  String get sleepQuality => isJa ? '睡眠の質' : isVi ? 'Chất lượng giấc ngủ' : 'Sleep quality';
  String get soreness => isJa ? '筋肉痛' : isVi ? 'Độ mỏi' : 'Soreness';
  String get stress => isJa ? 'ストレス' : isVi ? 'Căng thẳng' : 'Stress';
  String get userFallback => isJa ? 'あなた' : isVi ? 'Bạn' : 'User';
  String get waterFallback => isJa ? '水分' : isVi ? 'Nước' : 'Water';
  String get habitFallback => isJa ? '習慣' : isVi ? 'Thói quen' : 'Habit';
  String gemsEarned(int amount) => isJa ? '+$amount ジェム' : isVi ? '+$amount Gems' : '+$amount Gems';
  String checkInStateLabel(String value) {
    switch (value) {
      case 'tired':
        return isJa ? '疲れている' : isVi ? 'Mệt' : 'tired';
      case 'balanced':
        return isJa ? '安定している' : isVi ? 'Cân bằng' : 'balanced';
      case 'great energy':
        return isJa ? 'エネルギー十分' : isVi ? 'Nhiều năng lượng' : 'great energy';
      default:
        return value;
    }
  }

  String get today => isJa ? '今日' : isVi ? 'Hôm nay' : 'Today';
  String get workout => isJa ? 'ワークアウト' : isVi ? 'Workout' : 'Workout';
  String get coach => isJa ? 'コーチ' : isVi ? 'Coach' : 'Coach';
  String get nutrition => isJa ? '栄養' : isVi ? 'Dinh dưỡng' : 'Nutrition';
  String get profile => isJa ? 'プロフィール' : isVi ? 'Hồ sơ' : 'Profile';

  String get nutritionSubtitle => isJa
      ? 'バランスよく食べて、一日をやさしく整えましょう。'
      : isVi
          ? 'Ăn cân bằng để giữ nhịp tốt cho cả ngày.'
          : 'Fuel your day with balance and simple consistency.';
  String get leftKcal => isJa ? '残り KCAL' : isVi ? 'KCAL còn lại' : 'LEFT KCAL';
  String get protein => isJa ? 'たんぱく質' : isVi ? 'Protein' : 'PROTEIN';
  String get carbs => isJa ? '炭水化物' : isVi ? 'Carbs' : 'CARBS';
  String get fat => isJa ? '脂質' : isVi ? 'Fat' : 'FAT';
  String get aiReplanTitle => isJa ? 'AI再プラン' : isVi ? 'AI Re-plan' : 'AI Re-plan';
  String get aiReplanSubtitle => isJa
      ? '残りの食事を調整して、今日の目標に近づけます。'
      : isVi
          ? 'Điều chỉnh phần còn lại của ngày để gần mục tiêu hơn.'
          : 'Adjust the rest of today to stay closer to target.';
  String get todaysMeals => isJa ? '今日の食事' : isVi ? 'Bữa ăn hôm nay' : 'Today\'s meals';
  String get replan => isJa ? '再プラン' : isVi ? 'Lập lại' : 'Re-plan';
  String get logMeal => isJa ? '記録' : isVi ? 'Ghi bữa ăn' : 'Log meal';
  String get logged => isJa ? '記録済み' : isVi ? 'Đã ghi' : 'LOGGED';
  String get analyzePhoto => isJa ? '写真を解析' : isVi ? 'Phân tích ảnh' : 'Analyze photo';
  String get mealType => isJa ? '食事タイプ' : isVi ? 'Loại bữa ăn' : 'Meal type';
  String get optionalNote => isJa ? '任意メモ' : isVi ? 'Ghi chú tùy chọn' : 'Optional note';
  String get analyzeAndLog => isJa ? '解析して記録' : isVi ? 'Phân tích và lưu' : 'Analyze and log';
  String get updatePlan => isJa ? 'プラン更新' : isVi ? 'Cập nhật kế hoạch' : 'Update plan';
  String get latestAnalysis => isJa ? '最新の解析' : isVi ? 'Phân tích gần nhất' : 'Latest analysis';
  String get analyzedMealFallback => isJa
      ? '写真から食事を解析し、記録しました。'
      : isVi
          ? 'Đã phân tích và ghi bữa ăn từ ảnh tải lên.'
          : 'Meal analyzed and added from the uploaded photo.';
  String get nutritionTip => isJa
      ? '摂取量がずれたら、再プランして残りの食事バランスを整えましょう。'
      : isVi
          ? 'Nếu lượng ăn thay đổi, hãy re-plan để cân bằng lại phần còn lại trong ngày.'
          : 'If your intake shifts during the day, re-plan to rebalance the remaining meals.';
  String get replanRemainingMeals => isJa ? '残りの食事を再プラン' : isVi ? 'Lập lại các bữa còn lại' : 'Re-plan remaining meals';
  String get notesForAiReplan => isJa ? 'AI再プラン用メモ' : isVi ? 'Ghi chú cho AI re-plan' : 'Notes for AI re-plan';
  String get takePhoto => isJa ? '写真を撮る' : isVi ? 'Chụp ảnh' : 'Take photo';
  String get chooseFromLibrary => isJa ? 'ライブラリから選ぶ' : isVi ? 'Chọn từ thư viện' : 'Choose from library';
  String get analyzeMealPhoto => isJa ? '食事写真を解析' : isVi ? 'Phân tích ảnh bữa ăn' : 'Analyze meal photo';

  String get workoutSubtitle => isJa
      ? '意図を持って動き、やさしく安定したリズムを保ちましょう。'
      : isVi
          ? 'Di chuyển có chủ đích và giữ nhịp thật ổn định.'
          : 'Move with intention and keep the rhythm gentle but consistent.';
  String get todaysPlan => isJa ? '今日のプラン' : isVi ? 'Kế hoạch hôm nay' : 'TODAY\'S PLAN';
  String get startWorkout => isJa ? 'ワークアウト開始' : isVi ? 'Bắt đầu workout' : 'Start workout';
  String get workoutCompleted => isJa ? '完了しました' : isVi ? 'Đã hoàn thành' : 'Workout completed';
  String get exercises => isJa ? 'エクササイズ' : isVi ? 'Bài tập' : 'Exercises';
  String get refresh => isJa ? '更新' : isVi ? 'Làm mới' : 'Refresh';
  String get regenerateWorkout => isJa ? 'ワークアウト再生成' : isVi ? 'Tạo lại workout' : 'Regenerate workout';
  String get focusHint => isJa ? '例: mobility, cardio' : isVi ? 'Ví dụ: mobility, cardio' : 'Focus, e.g. mobility or cardio';

  String get coachSubtitle => isJa
      ? '必要なときに、やさしく短いサポートを。'
      : isVi
          ? 'Hỗ trợ ngắn gọn và thân thiện bất cứ khi nào bạn cần.'
          : 'Short, supportive guidance whenever you need it.';
  String get coachWelcome => isJa
      ? 'こんにちは。今日はどんな調子ですか？'
      : isVi
          ? 'Xin chào, hôm nay bạn cảm thấy thế nào?'
          : 'Hi there! I\'m your Sooti AI Coach. How are you feeling today?';
  String get askCoach => isJa ? 'コーチに相談する...' : isVi ? 'Hỏi coach của bạn...' : 'Ask your coach...';
  String get send => isJa ? '送信' : isVi ? 'Gửi' : 'Send';

  String get profileSubtitle => isJa
      ? '毎日のプランに使う情報と設定を整えましょう。'
      : isVi
          ? 'Chỉnh dữ liệu và cài đặt dùng cho kế hoạch hằng ngày.'
          : 'Edit the personal data and preferences that drive the Papipo daily plan.';
  String get rewards => isJa ? 'リワード' : isVi ? 'Phần thưởng' : 'Rewards';
  String get personalInfo => isJa ? '個人情報' : isVi ? 'Thông tin cá nhân' : 'Personal info';
  String get settings => isJa ? '設定' : isVi ? 'Cài đặt' : 'Settings';
  String get signOut => isJa ? 'サインアウト' : isVi ? 'Đăng xuất' : 'Sign out';
  String get premiumMember => isJa ? 'プレミアム会員' : isVi ? 'Thành viên premium' : 'PREMIUM MEMBER';
  String get saveProfile => isJa ? 'プロフィール保存' : isVi ? 'Lưu hồ sơ' : 'Save profile';
  String get saving => isJa ? '保存中...' : isVi ? 'Đang lưu...' : 'Saving...';
  String get aboutRewards => isJa ? 'リワードについて' : isVi ? 'Về phần thưởng' : 'About Rewards';
  String get gotIt => isJa ? 'わかりました' : isVi ? 'Đã hiểu' : 'Got it!';
  String get workoutPrefs => isJa ? 'ワークアウト設定' : isVi ? 'Tùy chọn workout' : 'Workout prefs';
  String gemsLabel(int amount) => isJa ? '$amount ジェム' : isVi ? '$amount Gems' : '$amount Gems';
  String badgeName(String code) {
    switch (code) {
      case 'water-warrior':
        return isJa ? 'ウォーター戦士' : isVi ? 'Chiến binh nước' : 'Water Warrior';
      case 'consistency-king':
        return isJa ? '継続キング' : isVi ? 'Vua kiên trì' : 'Consistency King';
      case 'balance-master':
        return isJa ? 'バランスマスター' : isVi ? 'Bậc thầy cân bằng' : 'Balance Master';
      default:
        return isJa ? 'バッジ' : isVi ? 'Huy hiệu' : 'Badge';
    }
  }
  String get rewardsHelpBody => isJa
      ? 'ジェムは毎日の習慣、食事記録、ワークアウト完了で増えます。バッジは継続の積み重ねで解放されます。'
      : isVi
          ? 'Gems đến từ thói quen hằng ngày, meal log và workout hoàn thành. Badge mở khóa khi sự đều đặn tích lũy theo thời gian.'
          : 'Gems come from daily habits, meal logs, and completed workouts. Badges unlock as consistency compounds over time.';

  String genderText(String code) {
    switch (code) {
      case 'MALE':
        return isJa ? '男性' : isVi ? 'Nam' : 'Male';
      case 'FEMALE':
        return isJa ? '女性' : isVi ? 'Nữ' : 'Female';
      default:
        return isJa ? 'その他' : isVi ? 'Khác' : 'Other';
    }
  }

  String goalLabel(String id) {
    switch (id) {
      case 'fat-loss':
        return isJa ? '脂肪を落とす' : isVi ? 'Giảm mỡ' : 'Fat Loss';
      case 'muscle':
        return isJa ? '筋肉をつける' : isVi ? 'Tăng cơ' : 'Build Muscle';
      case 'better-sleep':
        return isJa ? '睡眠を良くする' : isVi ? 'Ngủ tốt hơn' : 'Sleep Better';
      case 'eat-clean':
        return isJa ? '食事を整える' : isVi ? 'Ăn sạch hơn' : 'Eat Clean';
      default:
        return id;
    }
  }

  String activityLevelLabel(String id) {
    switch (id) {
      case 'sedentary':
        return isJa ? '低め' : isVi ? 'Ít vận động' : 'Sedentary';
      case 'light':
        return isJa ? '軽め' : isVi ? 'Nhẹ' : 'Light';
      case 'moderate':
        return isJa ? '普通' : isVi ? 'Vừa' : 'Moderate';
      case 'active':
      case 'very active':
        return isJa ? '高め' : isVi ? 'Năng động' : 'Active';
      default:
        return id;
    }
  }

  String durationLabel(String id) {
    switch (id) {
      case '14 days':
        return isJa ? '14日キックスタート' : isVi ? 'Khởi động 14 ngày' : '14 Days Kickstart';
      case '30 days':
        return isJa ? '30日チャレンジ' : isVi ? 'Thử thách 30 ngày' : '30 Days Challenge';
      case '8 weeks':
        return isJa ? '8週間リセット' : isVi ? 'Reset 8 tuần' : '8 Weeks Reset';
      case '12 weeks':
        return isJa ? '12週間ライフスタイル' : isVi ? 'Lối sống 12 tuần' : '12 Weeks Lifestyle';
      default:
        return id;
    }
  }

  String weightGoalLabel(int value) {
    switch (value) {
      case -5:
        return isJa ? '5kg減量' : isVi ? 'Giảm 5kg' : 'Lose 5kg';
      case -2:
        return isJa ? '2kg減量' : isVi ? 'Giảm 2kg' : 'Lose 2kg';
      case 0:
        return isJa ? '維持する' : isVi ? 'Giữ nguyên' : 'Maintain';
      case 2:
        return isJa ? '2kg増量' : isVi ? 'Tăng 2kg' : 'Gain 2kg';
      case 5:
        return isJa ? '5kg増量' : isVi ? 'Tăng 5kg' : 'Gain 5kg';
      default:
        return value.toString();
    }
  }

  String languageName(String code) {
    switch (code) {
      case 'ja':
        return isJa ? '日本語' : isVi ? 'Tiếng Nhật' : 'Japanese';
      case 'vi':
        return isJa ? 'ベトナム語' : isVi ? 'Tiếng Việt' : 'Vietnamese';
      case 'en':
      default:
        return isJa ? '英語' : isVi ? 'Tiếng Anh' : 'English';
    }
  }

  String habitName(String original) {
    switch (original) {
      case 'Morning Sunlight':
        return isJa ? '朝の日光' : isVi ? 'Ánh nắng buổi sáng' : original;
      case 'Meditation':
        return isJa ? '瞑想' : isVi ? 'Thiền' : original;
      case 'Stretching':
        return isJa ? 'ストレッチ' : isVi ? 'Giãn cơ' : original;
      case 'Hydration Check':
        return isJa ? '水分チェック' : isVi ? 'Kiểm tra nước' : original;
      default:
        return original;
    }
  }

  String mealTypeLabel(String type) {
    switch (type) {
      case 'BREAKFAST':
        return isJa ? '朝食' : isVi ? 'Bữa sáng' : 'Breakfast';
      case 'LUNCH':
        return isJa ? '昼食' : isVi ? 'Bữa trưa' : 'Lunch';
      case 'DINNER':
        return isJa ? '夕食' : isVi ? 'Bữa tối' : 'Dinner';
      case 'SNACK':
        return isJa ? '間食' : isVi ? 'Bữa phụ' : 'Snack';
      default:
        return type;
    }
  }
}
