import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'core/session/app_scope.dart';
import 'core/session/session_controller.dart';
import 'features/ai/ai_coach_screen.dart';
import 'features/auth/auth_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/nutrition/nutrition_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/workout/workout_screen.dart';
import 'theme/papipo_clay.dart';
import 'theme/papipo_theme.dart';

void main() {
  runApp(const PapipoBootstrap());
}

class PapipoBootstrap extends StatefulWidget {
  const PapipoBootstrap({super.key});

  @override
  State<PapipoBootstrap> createState() => _PapipoBootstrapState();
}

class _PapipoBootstrapState extends State<PapipoBootstrap> {
  static const _devAutoLoginEmail = String.fromEnvironment(
    'PAPIPO_DEV_AUTO_LOGIN_EMAIL',
  );
  static const _devAutoLoginPassword = String.fromEnvironment(
    'PAPIPO_DEV_AUTO_LOGIN_PASSWORD',
  );

  late final SessionController _sessionController;

  @override
  void initState() {
    super.initState();
    _sessionController = SessionController(
      autoLoginEmail: _devAutoLoginEmail,
      autoLoginPassword: _devAutoLoginPassword,
    )..bootstrap();
  }

  @override
  void dispose() {
    _sessionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      sessionController: _sessionController,
      child: Consumer<SessionController>(
        builder: (context, session, child) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'Papipo',
            theme: PapipoTheme.light(),
            locale: Locale(session.preferredLanguageCode),
            supportedLocales: const [
              Locale('ja'),
              Locale('vi'),
              Locale('en')
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate
            ],
            home: const _AppRouter()
          );
        },
      ),
    );
  }
}

class _AppRouter extends StatelessWidget {
  const _AppRouter();

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        switch (session.bootstrapState) {
          case SessionBootstrapState.loading:
            return const _LoadingScreen();
          case SessionBootstrapState.ready:
            if (!session.isAuthenticated) {
              return const AuthScreen();
            }
            if (!session.isOnboarded) {
              return const OnboardingScreen();
            }
            return const _AppShell();
        }
      }
    );
  }
}

class _AppShell extends StatefulWidget {
  const _AppShell();

  @override
  State<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<_AppShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final pages = const [
      DashboardScreen(),
      WorkoutScreen(),
      AiCoachScreen(),
      NutritionScreen(),
      ProfileScreen()
    ];

    return Scaffold(
      backgroundColor: PapipoTheme.bgBase,
      body: Stack(
        children: [
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 128),
                  child: pages[_currentIndex],
                ),
              ),
            ),
          ),
          PapipoBottomNav(
            currentIndex: _currentIndex,
            onChanged: (value) => setState(() => _currentIndex = value),
          ),
        ],
      ),
    );
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator()
      ),
    );
  }
}
