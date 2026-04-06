import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_clay.dart';
import '../../theme/papipo_theme.dart';
import 'exercise_catalog.dart';

class WorkoutScreen extends StatefulWidget {
  const WorkoutScreen({super.key});

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  bool _requested = false;
  Map<String, dynamic>? _selectedExercise;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<SessionController>();
      if (session.workoutResponse == null && session.isAuthenticated) {
        session.loadWorkout();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        final workoutResponse = session.workoutResponse;
        final workout = workoutResponse?['workout'] as Map<String, dynamic>?;
        final completedToday = workoutResponse?['completedToday'] == true;
        final exercises = (workout?['exercises'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();

        return Stack(
          children: [
            RefreshIndicator(
              onRefresh: session.loadWorkout,
              child: ListView(
                physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                children: [
                  Text(strings.workout, style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30)),
                  const SizedBox(height: 6),
                  Text(
                    strings.workoutSubtitle,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 22),
                  PapipoClayCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    strings.todaysPlan,
                                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                          color: PapipoTheme.primary,
                                        ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    workout?['title'] as String? ?? strings.todaysPlan,
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 28),
                                  ),
                                ],
                              ),
                            ),
                            const PapipoIconBadge(
                              icon: Icons.fitness_center_outlined,
                              color: PapipoTheme.primary,
                              size: 50,
                            )
                          ],
                        ),
                        const SizedBox(height: 18),
                        Wrap(
                          spacing: 14,
                          runSpacing: 10,
                          children: [
                            _WorkoutMeta(icon: Icons.timer_outlined, label: workout?['duration'] as String? ?? '45 min'),
                            _WorkoutMeta(icon: Icons.local_fire_department_outlined, label: workout?['calories'] as String? ?? '320 kcal'),
                          ],
                        ),
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            style: PapipoTheme.primaryButtonStyle(),
                            onPressed: session.isBusy
                                ? null
                                : completedToday
                                    ? null
                                    : () => session.completeWorkout(
                                          workoutPlanId: workout?['id'] as String?,
                                        ),
                            icon: Icon(completedToday ? Icons.check_circle_rounded : Icons.play_arrow_rounded),
                            label: Text(completedToday ? strings.workoutCompleted : strings.startWorkout),
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: Text(strings.exercises, style: Theme.of(context).textTheme.titleLarge),
                        ),
                      ),
                      GestureDetector(
                        onTap: session.isBusy ? null : () => _showRegenerateDialog(context, session),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: PapipoTheme.surface,
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: PapipoTheme.clayRaisedShadow,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.autorenew_rounded, size: 18, color: PapipoTheme.primary),
                              const SizedBox(width: 6),
                              Text(strings.refresh, style: Theme.of(context).textTheme.labelLarge),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 14),
                  ...List.generate(exercises.length, (index) {
                    final exercise = exercises[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: PapipoClayCard(
                        onTap: () => setState(() => _selectedExercise = exercise),
                        child: Row(
                          children: [
                            PapipoClayPanel(
                              padding: const EdgeInsets.all(0),
                              child: SizedBox(
                                width: 40,
                                height: 40,
                                child: Center(
                                  child: Text(
                                    '${index + 1}',
                                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                          color: PapipoTheme.textMuted,
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                exercise['name'] as String? ?? strings.exercises,
                                style: Theme.of(context).textTheme.bodyLarge,
                              ),
                            ),
                            Text(
                              '${exercise['sets']} x ${exercise['reps']}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: PapipoTheme.textMuted,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            if (_selectedExercise != null)
              _ExerciseOverlay(
                exercise: _selectedExercise!,
                onClose: () => setState(() => _selectedExercise = null),
              )
          ],
        );
      },
    );
  }

  Future<void> _showRegenerateDialog(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    final controller = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: PapipoTheme.surface,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(strings.regenerateWorkout, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Container(
                decoration: PapipoTheme.clayInputDecoration(),
                child: TextField(
                  controller: controller,
                  decoration: PapipoTheme.inputDecoration(strings.focusHint),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: PapipoTheme.primaryButtonStyle(),
                  onPressed: () async {
                    try {
                      await session.regenerateWorkout(focus: controller.text.trim());
                      if (!context.mounted) return;
                      Navigator.of(context).pop();
                    } on ApiException catch (error) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
                    }
                  },
                  child: Text(strings.updatePlan),
                ),
              )
            ],
          ),
        );
      },
    );
    controller.dispose();
  }
}

class _WorkoutMeta extends StatelessWidget {
  const _WorkoutMeta({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: PapipoTheme.textMuted),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: PapipoTheme.textMuted,
                fontWeight: FontWeight.w800,
              ),
        )
      ],
    );
  }
}

class _ExerciseOverlay extends StatelessWidget {
  const _ExerciseOverlay({
    required this.exercise,
    required this.onClose,
  });

  final Map<String, dynamic> exercise;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final slug = exercise['slug'] as String? ?? '';
    final spec = papipoExerciseSpecFor(slug, languageCode: Localizations.localeOf(context).languageCode);

    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.38),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: PapipoClayCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Align(
                    alignment: Alignment.topRight,
                    child: GestureDetector(
                      onTap: onClose,
                      child: const PapipoIconBadge(
                        icon: Icons.close_rounded,
                        color: PapipoTheme.textMuted,
                        size: 34,
                      ),
                    ),
                  ),
                  Text(
                    exercise['name'] as String? ?? strings.exercises,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 24),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 18),
                  Container(
                    width: double.infinity,
                    height: 240,
                    decoration: BoxDecoration(
                      color: spec.background,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: PapipoTheme.clayInsetShadow,
                    ),
                    child: Center(
                      child: Icon(spec.icon, size: 88, color: spec.foreground),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    spec.subtitle,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: spec.foreground),
                    textAlign: TextAlign.center,
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
