import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:papipo_mobile/core/api/api_client.dart';
import 'package:papipo_mobile/core/session/app_scope.dart';
import 'package:papipo_mobile/core/session/session_controller.dart';
import 'package:papipo_mobile/features/ai/ai_coach_screen.dart';
import 'package:papipo_mobile/theme/papipo_theme.dart';

void main() {
  testWidgets('ai coach screen renders empty conversation state', (tester) async {
    final sessionController = SessionController(
      apiClient: ApiClient(baseUrl: 'http://localhost:4000')
    );

    await tester.pumpWidget(
      AppScope(
        sessionController: sessionController,
        child: MaterialApp(
          theme: PapipoTheme.light(),
          home: const Scaffold(body: AiCoachScreen())
        ),
      ),
    );

    await tester.pump();

    expect(find.text('AI Coach'), findsOneWidget);
    expect(find.textContaining('How are you feeling today'), findsOneWidget);
  });
}
