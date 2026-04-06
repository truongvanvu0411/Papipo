import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:papipo_mobile/core/api/api_client.dart';
import 'package:papipo_mobile/core/session/app_scope.dart';
import 'package:papipo_mobile/core/session/session_controller.dart';
import 'package:papipo_mobile/features/nutrition/nutrition_screen.dart';
import 'package:papipo_mobile/features/workout/workout_screen.dart';
import 'package:papipo_mobile/theme/papipo_theme.dart';

Widget buildHarness(Widget child) {
  final sessionController = SessionController(
    apiClient: ApiClient(baseUrl: 'http://localhost:4000')
  );

  return AppScope(
    sessionController: sessionController,
    child: MaterialApp(
      theme: PapipoTheme.light(),
      home: Scaffold(body: child)
    ),
  );
}

void main() {
  testWidgets('nutrition screen renders empty state headings', (tester) async {
    await tester.pumpWidget(buildHarness(const NutritionScreen()));
    await tester.pump();

    expect(find.text('Nutrition'), findsOneWidget);
    expect(find.text('Today\'s meals'), findsOneWidget);
    expect(find.text('Fuel your day with balance and simple consistency.'), findsOneWidget);
  });

  testWidgets('workout screen renders empty state headings', (tester) async {
    await tester.pumpWidget(buildHarness(const WorkoutScreen()));
    await tester.pump();

    expect(find.text('Workout'), findsOneWidget);
    expect(find.text('Exercises'), findsOneWidget);
  });
}
