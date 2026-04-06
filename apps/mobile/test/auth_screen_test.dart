import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:papipo_mobile/core/api/api_client.dart';
import 'package:papipo_mobile/core/session/app_scope.dart';
import 'package:papipo_mobile/core/session/session_controller.dart';
import 'package:papipo_mobile/features/auth/auth_screen.dart';
import 'package:papipo_mobile/theme/papipo_theme.dart';

void main() {
  testWidgets('auth screen toggles between login and signup states', (tester) async {
    final sessionController = SessionController(
      apiClient: ApiClient(baseUrl: 'http://localhost:4000')
    );

    await tester.pumpWidget(
      AppScope(
        sessionController: sessionController,
        child: MaterialApp(
          theme: PapipoTheme.light(),
          home: const Scaffold(body: AuthScreen())
        )
      )
    );

    expect(find.text('Continue'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));

    await tester.tap(find.text('Sign up').first);
    await tester.pumpAndSettle();

    expect(find.text('Create account'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(3));
  });
}
