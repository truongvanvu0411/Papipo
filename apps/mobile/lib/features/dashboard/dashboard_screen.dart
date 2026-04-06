import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_clay.dart';
import '../../theme/papipo_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _didPromptCheckIn = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        final dashboard = session.dashboardResponse;
        final profile = dashboard?['profile'] as Map<String, dynamic>?;
        final metrics = dashboard?['metrics'] as Map<String, dynamic>?;
        final habits = (dashboard?['habits'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();
        final rewards = dashboard?['rewards'] as Map<String, dynamic>?;
        final waterSteps = (dashboard?['waterSteps'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();
        final hasCompletedCheckIn = metrics?['hasCompletedCheckInToday'] == true;
        final lastCheckInDate = session.profileResponse?['profile']?['lastCheckInDate'] as String?;

        _maybePromptCheckIn(
          context: context,
          session: session,
          hasCompletedCheckIn: hasCompletedCheckIn,
          lastCheckInDate: lastCheckInDate,
        );

        return RefreshIndicator(
          onRefresh: session.refreshDashboard,
          child: ListView(
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          strings.greeting(
                            (profile?['name'] as String?)?.trim().isNotEmpty == true
                                ? profile!['name'] as String
                                : strings.userFallback,
                          ),
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 31),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          strings.readySubtitle,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 15),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const PapipoIconBadge(
                        icon: Icons.emoji_events_outlined,
                        color: PapipoTheme.primary,
                        size: 52,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0x33F4D25E),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: const Color(0x55E6C74C)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.bolt_rounded, size: 14, color: Color(0xFFB78600)),
                            const SizedBox(width: 4),
                            Text(
                              '${(rewards?['gems'] as num?)?.toInt() ?? 0}',
                              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                    color: const Color(0xFF9A6A00),
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                      )
                    ],
                  )
                ],
              ),
              const SizedBox(height: 24),
              if ((profile?['aiWelcomeMessage'] as String?)?.isNotEmpty == true)
                PapipoClayCard(
                  color: PapipoTheme.primary.withValues(alpha: 0.08),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: PapipoTheme.primary,
                          borderRadius: BorderRadius.circular(999),
                          boxShadow: PapipoTheme.clayRaisedShadow,
                        ),
                        child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 21),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              strings.aiCoachMessage,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '"${profile?['aiWelcomeMessage'] as String}"',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: PapipoTheme.textMain,
                                    height: 1.45,
                                  ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              if ((profile?['aiWelcomeMessage'] as String?)?.isNotEmpty == true) const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: PapipoClayCard(
                      child: Column(
                        children: [
                          PapipoCircularProgress(
                            value: ((metrics?['readiness'] as num?) ?? 0).toDouble(),
                            color: PapipoTheme.primary,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            strings.readiness,
                            style: Theme.of(context).textTheme.labelLarge?.copyWith(color: PapipoTheme.textMain),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${((metrics?['readiness'] as num?) ?? 0).toInt()}%',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 30),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: PapipoClayCard(
                      child: Column(
                        children: [
                          PapipoCircularProgress(
                            value: ((metrics?['sleepScore'] as num?) ?? 0).toDouble(),
                            color: PapipoTheme.secondary,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            strings.sleepScore,
                            style: Theme.of(context).textTheme.labelLarge?.copyWith(color: PapipoTheme.textMain),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${((metrics?['sleepScore'] as num?) ?? 0).toInt()}%',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 30),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if ((metrics?['dailyInsight'] as String?)?.isNotEmpty == true)
                PapipoClayCard(
                  color: const Color(0xFFF2F8FC),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_outline_rounded, color: Color(0xFF5C93B8), size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          metrics?['dailyInsight'] as String,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: const Color(0xFF31566F),
                                fontSize: 14,
                                height: 1.45,
                              ),
                        ),
                      )
                    ],
                  ),
                ),
              if ((metrics?['dailyInsight'] as String?)?.isNotEmpty == true) const SizedBox(height: 20),
              PapipoClayCard(
                child: Column(
                  children: [
                    Row(
                      children: [
                        const PapipoIconBadge(
                          icon: Icons.water_drop_outlined,
                          color: Color(0xFF58A7D5),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(strings.hydration, style: Theme.of(context).textTheme.bodyLarge),
                              const SizedBox(height: 2),
                              Text(
                                '${((metrics?['waterConsumedLiters'] as num?) ?? 0).toStringAsFixed(1)}L / ${((metrics?['waterTargetLiters'] as num?) ?? 0).toStringAsFixed(1)}L',
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            _CircleActionButton(
                              icon: Icons.add_rounded,
                              color: PapipoTheme.secondary,
                              onTap: session.isBusy ? null : () => _showCustomWaterDialog(context, session),
                            ),
                            const SizedBox(width: 8),
                            _ActionPillButton(
                              label: strings.drinkAll,
                              onTap: session.isBusy ? null : () => _completeAllWater(context, session, waterSteps),
                            ),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 18),
                    PapipoLinearProgress(
                      value: ((metrics?['waterConsumedLiters'] as num?) ?? 0).toDouble(),
                      max: ((metrics?['waterTargetLiters'] as num?) ?? 1).toDouble(),
                      fillColor: const Color(0xFF65B8EA),
                    ),
                    const SizedBox(height: 18),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: waterSteps.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 2.35,
                      ),
                      itemBuilder: (context, index) {
                        final step = waterSteps[index];
                        final completed = step['completed'] == true;
                        return InkWell(
                          onTap: session.isBusy ? null : () => _toggleWater(context, session, step),
                          borderRadius: BorderRadius.circular(18),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: completed ? const Color(0xFFE5F4FE) : PapipoTheme.surface,
                              borderRadius: BorderRadius.circular(18),
                              boxShadow: completed
                                  ? PapipoTheme.clayInsetShadow
                                  : PapipoTheme.clayRaisedShadow,
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    strings.habitName(step['label'] as String? ?? strings.waterFallback),
                                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                          color: completed ? const Color(0xFF3F8DBB) : PapipoTheme.textMain,
                                        ),
                                  ),
                                ),
                                Text(
                                  '${step['amountLiters'] ?? step['amount'] ?? 0}L',
                                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                        color: completed ? const Color(0xFF3F8DBB) : PapipoTheme.textMuted,
                                      ),
                                ),
                                if (completed) ...[
                                  const SizedBox(width: 6),
                                  const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF3F8DBB)),
                                ]
                              ],
                            ),
                          ),
                        );
                      },
                    )
                  ],
                ),
              ),
              const SizedBox(height: 22),
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Text(strings.dailyHabits, style: Theme.of(context).textTheme.titleLarge),
              ),
              const SizedBox(height: 14),
              ...habits.map((habit) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _HabitCard(
                      habit: habit,
                      disabled: session.isBusy,
                      onTap: () => session.toggleHabit(habit['id'] as String),
                    ),
                  )),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  void _maybePromptCheckIn({
    required BuildContext context,
    required SessionController session,
    required bool hasCompletedCheckIn,
    required String? lastCheckInDate,
  }) {
    if (_didPromptCheckIn || !session.isAuthenticated || session.isBusy) {
      return;
    }
    if (hasCompletedCheckIn) {
      return;
    }

    _didPromptCheckIn = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final hasHistory = lastCheckInDate != null && lastCheckInDate.isNotEmpty;
      if (hasHistory) {
        _showDailyCheckIn(context, session);
      } else {
        _showInitialCheckIn(context, session);
      }
    });
  }

  Future<void> _showCustomWaterDialog(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    final controller = TextEditingController(text: '0.3');
    final result = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      backgroundColor: PapipoTheme.surface,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(strings.addCustomWater, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Container(
                decoration: PapipoTheme.clayInputDecoration(),
                child: TextField(
                  controller: controller,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: PapipoTheme.inputDecoration(strings.amountInLiters),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: PapipoTheme.primaryButtonStyle(),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: Text(strings.addWater),
                ),
              )
            ],
          ),
        );
      },
    );
    if (result == true) {
      final amount = double.tryParse(controller.text.trim());
      if (amount != null && amount > 0) {
        await session.logWater(amount, sourceLabel: strings.addWater);
      }
    }
    controller.dispose();
  }

  Future<void> _completeAllWater(
    BuildContext context,
    SessionController session,
    List<Map<String, dynamic>> waterSteps,
  ) async {
    final strings = PapipoStrings.of(context);
    for (final step in waterSteps) {
      if (step['completed'] == true) continue;
      final amount = ((step['amountLiters'] as num?) ?? (step['amount'] as num?) ?? 0).toDouble();
      await session.logWater(
        amount,
        sourceLabel: strings.habitName(step['label'] as String? ?? strings.waterFallback),
      );
    }
  }

  Future<void> _toggleWater(BuildContext context, SessionController session, Map<String, dynamic> step) async {
    final strings = PapipoStrings.of(context);
    if (step['completed'] == true) return;
    final amount = ((step['amountLiters'] as num?) ?? (step['amount'] as num?) ?? 0).toDouble();
    await session.logWater(
      amount,
      sourceLabel: strings.habitName(step['label'] as String? ?? strings.waterFallback),
    );
  }

  Future<void> _showInitialCheckIn(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    String selected = 'balanced';
    final options = const ['tired', 'balanced', 'great energy'];
    final result = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: PapipoTheme.surface,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(strings.howFeeling, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: options
                        .map((option) => ChoiceChip(
                              label: Text(strings.checkInStateLabel(option)),
                              selected: selected == option,
                              onSelected: (_) => setStateModal(() => selected = option),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: PapipoTheme.primaryButtonStyle(),
                      onPressed: () => Navigator.of(context).pop(selected),
                      child: Text(strings.submitCheckIn),
                    ),
                  )
                ],
              ),
            );
          },
        );
      },
    );
    if (result != null) {
      try {
        await session.submitInitialCheckIn(result);
      } on ApiException catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  Future<void> _showDailyCheckIn(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    final sleepController = TextEditingController(text: '7');
    double sleepQuality = 3;
    double soreness = 2;
    double stress = 2;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: PapipoTheme.surface,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            return Padding(
              padding: EdgeInsets.fromLTRB(24, 8, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(strings.dailyCheckIn, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 14),
                    Container(
                      decoration: PapipoTheme.clayInputDecoration(),
                      child: TextField(
                        controller: sleepController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: PapipoTheme.inputDecoration(strings.sleepHours),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('${strings.sleepQuality}: ${sleepQuality.toInt()}'),
                    Slider(
                      value: sleepQuality,
                      min: 1,
                      max: 5,
                      divisions: 4,
                      activeColor: PapipoTheme.primary,
                      onChanged: (value) => setStateModal(() => sleepQuality = value),
                    ),
                    Text('${strings.soreness}: ${soreness.toInt()}'),
                    Slider(
                      value: soreness,
                      min: 1,
                      max: 5,
                      divisions: 4,
                      activeColor: PapipoTheme.secondary,
                      onChanged: (value) => setStateModal(() => soreness = value),
                    ),
                    Text('${strings.stress}: ${stress.toInt()}'),
                    Slider(
                      value: stress,
                      min: 1,
                      max: 5,
                      divisions: 4,
                      activeColor: PapipoTheme.secondary,
                      onChanged: (value) => setStateModal(() => stress = value),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: PapipoTheme.primaryButtonStyle(),
                        onPressed: () async {
                          try {
                            await session.submitDailyCheckIn(
                              sleepHours: double.tryParse(sleepController.text.trim()) ?? 7,
                              sleepQuality: sleepQuality.toInt(),
                              soreness: soreness.toInt(),
                              stress: stress.toInt(),
                            );
                            if (!context.mounted) return;
                            Navigator.of(context).pop();
                          } on ApiException catch (error) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
                          }
                        },
                        child: Text(strings.save),
                      ),
                    )
                  ],
                ),
              ),
            );
          },
        );
      },
    );
    sleepController.dispose();
  }
}

class _HabitCard extends StatelessWidget {
  const _HabitCard({
    required this.habit,
    required this.disabled,
    required this.onTap,
  });

  final Map<String, dynamic> habit;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final completed = habit['completed'] == true;
    final icon = _iconFor((habit['icon'] as String?) ?? 'activity');
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: completed ? PapipoTheme.bgBase : PapipoTheme.surface,
          borderRadius: BorderRadius.circular(22),
          boxShadow: completed ? PapipoTheme.clayInsetShadow : PapipoTheme.clayRaisedShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: completed ? PapipoTheme.surface : PapipoTheme.bgBase,
                borderRadius: BorderRadius.circular(18),
                boxShadow: completed ? PapipoTheme.clayRaisedShadow : PapipoTheme.clayInsetShadow,
              ),
              child: Icon(
                completed ? Icons.check_circle_rounded : icon,
                color: completed ? PapipoTheme.primary : PapipoTheme.textMuted,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
                child: Text(
                strings.habitName(habit['name'] as String? ?? strings.habitFallback),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: completed ? PapipoTheme.textMuted : PapipoTheme.textMain,
                      decoration: completed ? TextDecoration.lineThrough : null,
                    ),
              ),
            ),
            if (completed)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.auto_awesome_rounded, size: 14, color: Color(0xFFCA9B1F)),
                  const SizedBox(width: 4),
                  Text(
                    strings.gemsEarned(5),
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: const Color(0xFFB38100),
                        ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(String code) {
    switch (code) {
      case 'sun':
        return Icons.wb_sunny_outlined;
      case 'brain':
        return Icons.psychology_alt_outlined;
      default:
        return Icons.favorite_outline;
    }
  }
}

class _ActionPillButton extends StatelessWidget {
  const _ActionPillButton({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: PapipoTheme.floatingAccentDecoration().copyWith(
          boxShadow: PapipoTheme.clayRaisedShadow,
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
    );
  }
}

class _CircleActionButton extends StatelessWidget {
  const _CircleActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: PapipoTheme.surface,
          borderRadius: BorderRadius.circular(999),
          boxShadow: PapipoTheme.clayRaisedShadow,
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }
}
