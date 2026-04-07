import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:papipo_mobile/core/api/api_client.dart';
import 'package:papipo_mobile/core/session/session_controller.dart';

void main() {
  test('bootstrap auto-logins when dev credentials are provided', () async {
    final apiClient = _FakeApiClient();
    final storage = _MemorySecureStorage();
    final session = SessionController(
      apiClient: apiClient,
      storage: storage,
      autoLoginEmail: 'demo@papipo.local',
      autoLoginPassword: 'ChangeMe123!',
    );

    await session.bootstrap();

    expect(session.bootstrapState, SessionBootstrapState.ready);
    expect(session.isAuthenticated, isTrue);
    expect(session.isOnboarded, isTrue);
    expect(
      storage.values['papipo.auth_user'],
      contains('"email":"demo@papipo.local"'),
    );
    expect(
      apiClient.requestedPaths,
      containsAll(<String>[
        '/auth/login',
        '/users/me',
        '/dashboard/today',
        '/meal-plans/today',
        '/workout-plans/today',
      ]),
    );
  });
}

class _FakeApiClient extends ApiClient {
  _FakeApiClient() : super(baseUrl: 'http://localhost:4000');

  final List<String> requestedPaths = <String>[];

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    String? accessToken,
  }) async {
    requestedPaths.add(path);
    if (path == '/auth/login') {
      return <String, dynamic>{
        'accessToken': 'token-123',
        'refreshToken': 'refresh-123',
        'user': <String, dynamic>{
          'id': 'user-1',
          'email': 'demo@papipo.local',
          'role': 'USER',
          'status': 'ACTIVE',
          'profile': <String, dynamic>{
            'name': 'Papipo Demo',
            'preferredLanguage': 'ja',
            'isOnboarded': true,
          },
        },
      };
    }

    throw UnimplementedError('Unexpected POST path: $path');
  }

  @override
  Future<dynamic> get(String path, {String? accessToken}) async {
    requestedPaths.add(path);
    switch (path) {
      case '/users/me':
        return <String, dynamic>{
          'profile': <String, dynamic>{
            'name': 'Papipo Demo',
            'preferredLanguage': 'ja',
            'isOnboarded': true,
          },
        };
      case '/dashboard/today':
        return <String, dynamic>{
          'gems': 24,
          'readinessScore': 100,
        };
      case '/meal-plans/today':
        return <String, dynamic>{
          'meals': <Map<String, dynamic>>[],
        };
      case '/workout-plans/today':
        return <String, dynamic>{
          'title': 'Foundation Flow',
        };
    }

    throw UnimplementedError('Unexpected GET path: $path');
  }
}

class _MemorySecureStorage extends FlutterSecureStorage {
  _MemorySecureStorage();

  final Map<String, String> values = <String, String>{};

  @override
  Future<void> write({
    required String key,
    required String? value,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value == null) {
      values.remove(key);
      return;
    }
    values[key] = value;
  }

  @override
  Future<String?> read({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return values[key];
  }

  @override
  Future<void> delete({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    values.remove(key);
  }
}
