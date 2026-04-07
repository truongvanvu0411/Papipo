import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/api_client.dart';

enum SessionBootstrapState { loading, ready }

class SessionController extends ChangeNotifier {
  SessionController({
    ApiClient? apiClient,
    FlutterSecureStorage? storage,
    String? autoLoginEmail,
    String? autoLoginPassword,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? const FlutterSecureStorage(),
        _autoLoginEmail = _normalizeOptionalValue(autoLoginEmail),
        _autoLoginPassword = _normalizeOptionalValue(autoLoginPassword);

  static const _accessTokenKey = 'papipo.access_token';
  static const _refreshTokenKey = 'papipo.refresh_token';
  static const _authUserKey = 'papipo.auth_user';

  final ApiClient _apiClient;
  final FlutterSecureStorage _storage;
  final String? _autoLoginEmail;
  final String? _autoLoginPassword;

  SessionBootstrapState _bootstrapState = SessionBootstrapState.loading;
  bool _isBusy = false;
  String? _errorMessage;
  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _authUser;
  Map<String, dynamic>? _profileResponse;
  Map<String, dynamic>? _dashboardResponse;
  Map<String, dynamic>? _nutritionResponse;
  Map<String, dynamic>? _workoutResponse;
  Map<String, dynamic>? _mealAnalysisResponse;
  List<Map<String, dynamic>> _aiConversations = const [];
  List<Map<String, dynamic>> _aiMessages = const [];
  String? _activeConversationId;

  SessionBootstrapState get bootstrapState => _bootstrapState;
  bool get isBusy => _isBusy;
  bool get isAuthenticated => _accessToken != null;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get authUser => _authUser;
  Map<String, dynamic>? get profileResponse => _profileResponse;
  Map<String, dynamic>? get dashboardResponse => _dashboardResponse;
  Map<String, dynamic>? get nutritionResponse => _nutritionResponse;
  Map<String, dynamic>? get workoutResponse => _workoutResponse;
  Map<String, dynamic>? get mealAnalysisResponse => _mealAnalysisResponse;
  List<Map<String, dynamic>> get aiConversations => _aiConversations;
  List<Map<String, dynamic>> get aiMessages => _aiMessages;
  String? get activeConversationId => _activeConversationId;
  String get preferredLanguageCode {
    final profileLanguage = _profileResponse?['profile']?['preferredLanguage'];
    if (profileLanguage is String && profileLanguage.trim().isNotEmpty) {
      return profileLanguage;
    }
    final authProfileLanguage = _authUser?['profile']?['preferredLanguage'];
    if (authProfileLanguage is String && authProfileLanguage.trim().isNotEmpty) {
      return authProfileLanguage;
    }
    return 'ja';
  }

  bool get isOnboarded {
    final authProfile = _authUser?['profile'];
    if (authProfile is Map<String, dynamic> && authProfile['isOnboarded'] == true) {
      return true;
    }
    final fullProfile = _profileResponse?['profile'];
    return fullProfile is Map<String, dynamic> && fullProfile['isOnboarded'] == true;
  }

  Future<void> bootstrap() async {
    _bootstrapState = SessionBootstrapState.loading;
    notifyListeners();

    _accessToken = await _storage.read(key: _accessTokenKey);
    _refreshToken = await _storage.read(key: _refreshTokenKey);
    final authUserJson = await _storage.read(key: _authUserKey);
    if (authUserJson != null && authUserJson.isNotEmpty) {
      _authUser = jsonDecode(authUserJson) as Map<String, dynamic>;
    }

    if (_accessToken == null) {
      if (_autoLoginEmail != null && _autoLoginPassword != null) {
        try {
          await login(
            email: _autoLoginEmail,
            password: _autoLoginPassword,
          );
        } catch (_) {
          await _clearSession();
        }
      }
      _bootstrapState = SessionBootstrapState.ready;
      notifyListeners();
      return;
    }

    try {
      await loadProfile(refreshOnUnauthorized: true);
      if (isOnboarded) {
        await refreshUserHomeData(refreshOnUnauthorized: true);
      }
    } catch (_) {
      await _clearSession();
    }

    _bootstrapState = SessionBootstrapState.ready;
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password
  }) async {
    await _runBusy(() async {
      final response = await _apiClient.post('/auth/login', body: {
        'email': email,
        'password': password
      });
      await _persistAuthResponse(response as Map<String, dynamic>);
      await loadProfile();
      if (isOnboarded) {
        await refreshUserHomeData();
      }
    });
  }

  Future<void> register({
    required String email,
    required String password,
    String? name,
    String preferredLanguage = 'ja'
  }) async {
    await _runBusy(() async {
      final response = await _apiClient.post('/auth/register', body: {
        'email': email,
        'password': password,
        'name': name,
        'preferredLanguage': preferredLanguage
      });
      await _persistAuthResponse(response as Map<String, dynamic>);
      await loadProfile();
    });
  }

  Future<void> loadProfile({bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/users/me', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _profileResponse = response as Map<String, dynamic>;
    final profile = _profileResponse?['profile'];
    if (_authUser != null && _authUser!['profile'] is Map<String, dynamic> && profile is Map<String, dynamic>) {
      (_authUser!['profile'] as Map<String, dynamic>)['isOnboarded'] = profile['isOnboarded'] == true;
      (_authUser!['profile'] as Map<String, dynamic>)['preferredLanguage'] = profile['preferredLanguage'];
      (_authUser!['profile'] as Map<String, dynamic>)['name'] = profile['name'];
      await _storage.write(key: _authUserKey, value: jsonEncode(_authUser));
    }
    notifyListeners();
  }

  Future<void> refreshDashboard({bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/dashboard/today', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _dashboardResponse = response as Map<String, dynamic>;
    notifyListeners();
  }

  Future<void> loadNutrition({bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/meal-plans/today', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _nutritionResponse = response as Map<String, dynamic>;
    notifyListeners();
  }

  Future<void> loadWorkout({bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/workout-plans/today', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _workoutResponse = response as Map<String, dynamic>;
    notifyListeners();
  }

  Future<void> refreshUserHomeData({bool refreshOnUnauthorized = false}) async {
    await Future.wait([
      refreshDashboard(refreshOnUnauthorized: refreshOnUnauthorized),
      loadNutrition(refreshOnUnauthorized: refreshOnUnauthorized),
      loadWorkout(refreshOnUnauthorized: refreshOnUnauthorized)
    ]);
  }

  Future<void> completeOnboarding(Map<String, dynamic> payload) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/onboarding/complete',
          accessToken: _accessToken,
          body: payload
        )
      );
      _dashboardResponse = response as Map<String, dynamic>;
      await loadProfile();
      await loadNutrition();
      await loadWorkout();
    });
  }

  Future<void> submitInitialCheckIn(String selectedState) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/daily-checkins/initial',
          accessToken: _accessToken,
          body: {'selectedState': selectedState}
        )
      );
      _dashboardResponse = response as Map<String, dynamic>;
      await loadProfile();
    });
  }

  Future<void> submitDailyCheckIn({
    required double sleepHours,
    required int sleepQuality,
    required int soreness,
    required int stress
  }) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/daily-checkins',
          accessToken: _accessToken,
          body: {
            'sleepHours': sleepHours,
            'sleepQuality': sleepQuality,
            'soreness': soreness,
            'stress': stress
          }
        )
      );
      _dashboardResponse = response as Map<String, dynamic>;
      await loadProfile();
    });
  }

  Future<void> logWater(double amountLiters, {String sourceLabel = 'Quick add'}) async {
    await _runBusy(() async {
      await _authorizedRequest(
        () => _apiClient.post(
          '/water-logs',
          accessToken: _accessToken,
          body: {
            'amountLiters': amountLiters,
            'sourceLabel': sourceLabel
          }
        )
      );
      await refreshDashboard();
    });
  }

  Future<void> toggleHabit(String habitId) async {
    await _runBusy(() async {
      await _authorizedRequest(
        () => _apiClient.post(
          '/habit-logs/$habitId/toggle',
          accessToken: _accessToken
        )
      );
      await refreshDashboard();
    });
  }

  Future<void> logMealFromPlan({String? mealPlanId, String? mealType}) async {
    await _runBusy(() async {
      await _authorizedRequest(
        () => _apiClient.post(
          '/meal-logs',
          accessToken: _accessToken,
          body: {
            if (mealPlanId != null) 'mealPlanId': mealPlanId,
            if (mealType != null) 'mealType': mealType
          }
        )
      );
      await refreshUserHomeData();
    });
  }

  Future<void> logCustomMeal({
    required String mealType,
    required String name,
    required int calories,
    required int protein,
    required int carbs,
    required int fat
  }) async {
    await _runBusy(() async {
      await _authorizedRequest(
        () => _apiClient.post(
          '/meal-logs/custom',
          accessToken: _accessToken,
          body: {
            'mealType': mealType,
            'name': name,
            'calories': calories,
            'protein': protein,
            'carbs': carbs,
            'fat': fat
          }
        )
      );
      await refreshUserHomeData();
    });
  }

  Future<void> replanMeals({String? notes}) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/meal-plans/replan',
          accessToken: _accessToken,
          body: {
            if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim()
          }
        )
      );
      _nutritionResponse = response as Map<String, dynamic>;
      notifyListeners();
      await refreshDashboard();
    });
  }

  Future<void> analyzeMealPhoto({
    required String fileName,
    required String mimeType,
    required String base64Data,
    String mealType = 'SNACK',
    String? notes
  }) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/meal-analysis/image',
          accessToken: _accessToken,
          body: {
            'fileName': fileName,
            'mimeType': mimeType,
            'base64Data': base64Data,
            'mealType': mealType,
            if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim()
          }
        )
      );
      _mealAnalysisResponse = response as Map<String, dynamic>;
      final nutrition = _mealAnalysisResponse?['nutrition'];
      if (nutrition is Map<String, dynamic>) {
        _nutritionResponse = nutrition;
      }
      notifyListeners();
      await refreshDashboard();
    });
  }

  Future<void> regenerateWorkout({String? focus}) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/workout-plans/regenerate',
          accessToken: _accessToken,
          body: {
            if (focus != null && focus.trim().isNotEmpty) 'focus': focus
          }
        )
      );
      _workoutResponse = response as Map<String, dynamic>;
      await refreshDashboard();
    });
  }

  Future<void> completeWorkout({String? workoutPlanId}) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/workouts/complete',
          accessToken: _accessToken,
          body: {
            if (workoutPlanId != null) 'workoutPlanId': workoutPlanId
          }
        )
      );
      _workoutResponse = response as Map<String, dynamic>;
      await refreshDashboard();
    });
  }

  Future<void> loadAiConversations({bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/ai/conversations', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _aiConversations = (response as List)
        .cast<Map<String, dynamic>>();
    if (_activeConversationId == null && _aiConversations.isNotEmpty) {
      _activeConversationId = _aiConversations.first['id'] as String?;
    }
    notifyListeners();
  }

  Future<void> loadAiMessages(String conversationId, {bool refreshOnUnauthorized = false}) async {
    final response = await _authorizedRequest(
      () => _apiClient.get('/ai/conversations/$conversationId/messages', accessToken: _accessToken),
      refreshOnUnauthorized: refreshOnUnauthorized
    );
    _activeConversationId = conversationId;
    _aiMessages = (response as List).cast<Map<String, dynamic>>();
    notifyListeners();
  }

  Future<void> sendCoachMessage(String message) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.post(
          '/ai/coach/chat',
          accessToken: _accessToken,
          body: {
            'message': message,
            if (_activeConversationId != null) 'conversationId': _activeConversationId
          }
        )
      );
      final payload = response as Map<String, dynamic>;
      final conversation = payload['conversation'] as Map<String, dynamic>;
      _activeConversationId = conversation['id'] as String?;
      _aiMessages = (payload['messages'] as List).cast<Map<String, dynamic>>();
      await loadAiConversations();
    });
  }

  void selectConversation(String? conversationId) {
    _activeConversationId = conversationId;
    if (conversationId == null) {
      _aiMessages = const [];
    }
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> payload) async {
    await _runBusy(() async {
      final response = await _authorizedRequest(
        () => _apiClient.patch(
          '/users/me',
          accessToken: _accessToken,
          body: payload
        )
      );
      _profileResponse = response as Map<String, dynamic>;
      await refreshUserHomeData();
    });
  }

  Future<void> logout() async {
    final refreshToken = _refreshToken;
    if (refreshToken != null) {
      try {
        await _apiClient.post('/auth/logout', body: {'refreshToken': refreshToken});
      } catch (_) {
        // Best effort only.
      }
    }
    await _clearSession();
    notifyListeners();
  }

  Future<dynamic> _authorizedRequest(
    Future<dynamic> Function() request, {
    bool refreshOnUnauthorized = true
  }) async {
    try {
      return await request();
    } on ApiException catch (error) {
      if (error.statusCode == 401 && refreshOnUnauthorized && _refreshToken != null) {
        await _refreshTokens();
        return request();
      }
      rethrow;
    }
  }

  Future<void> _refreshTokens() async {
    final refreshToken = _refreshToken;
    if (refreshToken == null) {
      throw const ApiException(statusCode: 401, message: 'Session expired');
    }
    final response = await _apiClient.post('/auth/refresh', body: {
      'refreshToken': refreshToken
    });
    await _persistAuthResponse(response as Map<String, dynamic>);
  }

  Future<void> _persistAuthResponse(Map<String, dynamic> response) async {
    _accessToken = response['accessToken'] as String?;
    _refreshToken = response['refreshToken'] as String?;
    final user = response['user'];
    _authUser = user is Map<String, dynamic> ? user : null;
    await _storage.write(key: _accessTokenKey, value: _accessToken);
    await _storage.write(key: _refreshTokenKey, value: _refreshToken);
    if (_authUser != null) {
      await _storage.write(key: _authUserKey, value: jsonEncode(_authUser));
    }
    notifyListeners();
  }

  Future<void> _clearSession() async {
    _accessToken = null;
    _refreshToken = null;
    _authUser = null;
    _profileResponse = null;
    _dashboardResponse = null;
    _nutritionResponse = null;
    _workoutResponse = null;
    _mealAnalysisResponse = null;
    _aiConversations = const [];
    _aiMessages = const [];
    _activeConversationId = null;
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _authUserKey);
  }

  Future<void> _runBusy(Future<void> Function() task) async {
    _isBusy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await task();
    } on ApiException catch (error) {
      _errorMessage = error.message;
      rethrow;
    } catch (error) {
      _errorMessage = error.toString();
      rethrow;
    } finally {
      _isBusy = false;
      notifyListeners();
    }
  }

  static String? _normalizeOptionalValue(String? value) {
    if (value == null) {
      return null;
    }
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }
}
