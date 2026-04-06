import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_clay.dart';
import '../../theme/papipo_theme.dart';

class NutritionScreen extends StatefulWidget {
  const NutritionScreen({super.key});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  final ImagePicker _imagePicker = ImagePicker();
  bool _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<SessionController>();
      if (session.nutritionResponse == null && session.isAuthenticated) {
        session.loadNutrition();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        final nutrition = session.nutritionResponse;
        final meals = (nutrition?['meals'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();
        final mealLogs = (nutrition?['mealLogs'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();
        final metrics = nutrition?['metrics'] as Map<String, dynamic>?;
        final mealAnalysis = session.mealAnalysisResponse;
        final analyzedMeal = mealAnalysis?['analyzedMeal'] as Map<String, dynamic>?;
        final summary = mealAnalysis?['summary'] as String?;
        final caloriesConsumed = ((metrics?['caloriesConsumed'] as num?) ?? 0).toDouble();
        final caloriesTarget = ((metrics?['caloriesTarget'] as num?) ?? 0).toDouble();
        final caloriesLeft = (caloriesTarget - caloriesConsumed).round();

        return RefreshIndicator(
          onRefresh: session.loadNutrition,
          child: ListView(
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(strings.nutrition,
                            style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30)),
                        const SizedBox(height: 6),
                        Text(
                          strings.nutritionSubtitle,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      _RoundIconButton(
                        icon: session.isBusy ? Icons.hourglass_top_rounded : Icons.camera_alt_outlined,
                        color: PapipoTheme.secondary,
                        onTap: session.isBusy ? null : () => _pickAndAnalyzeMeal(context, session),
                      ),
                      const SizedBox(width: 10),
                      const PapipoIconBadge(
                        icon: Icons.restaurant_menu_outlined,
                        color: PapipoTheme.secondary,
                        size: 48,
                      ),
                    ],
                  )
                ],
              ),
              const SizedBox(height: 22),
              PapipoClayCard(
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$caloriesLeft',
                                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                      fontSize: 44,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                              Text(
                                strings.leftKcal,
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${caloriesConsumed.round()}',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    color: PapipoTheme.textMuted,
                                  ),
                            ),
                            Text(
                              '/ ${caloriesTarget.round()} kcal',
                              style: Theme.of(context).textTheme.labelLarge,
                            ),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 16),
                    PapipoLinearProgress(
                      value: caloriesConsumed,
                      max: caloriesTarget <= 0 ? 1 : caloriesTarget,
                      fillColor: PapipoTheme.secondary,
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: _MacroStat(
                            label: strings.protein,
                            consumed: ((metrics?['proteinConsumed'] as num?) ?? 0).toInt(),
                            target: ((metrics?['proteinTarget'] as num?) ?? 0).toInt(),
                          ),
                        ),
                        Expanded(
                          child: _MacroStat(
                            label: strings.carbs,
                            consumed: ((metrics?['carbsConsumed'] as num?) ?? 0).toInt(),
                            target: ((metrics?['carbsTarget'] as num?) ?? 0).toInt(),
                          ),
                        ),
                        Expanded(
                          child: _MacroStat(
                            label: strings.fat,
                            consumed: ((metrics?['fatConsumed'] as num?) ?? 0).toInt(),
                            target: ((metrics?['fatTarget'] as num?) ?? 0).toInt(),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 18),
              if ((nutrition?['replanSummary'] as String?)?.isNotEmpty == true ||
                  (metrics?['nutritionInsight'] as String?)?.isNotEmpty == true)
                PapipoClayCard(
                  color: const Color(0xFFF1FAF1),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_outline_rounded, size: 20, color: Color(0xFF5E9B63)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          (nutrition?['replanSummary'] as String?) ??
                              (metrics?['nutritionInsight'] as String?) ??
                              '',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: const Color(0xFF406B43),
                                fontSize: 14,
                                height: 1.45,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              if ((nutrition?['replanSummary'] as String?)?.isNotEmpty == true ||
                  (metrics?['nutritionInsight'] as String?)?.isNotEmpty == true)
                const SizedBox(height: 18),
              if (caloriesConsumed > caloriesTarget * 0.7 && caloriesTarget > 0)
                PapipoClayCard(
                  color: const Color(0xFFEFF6FF),
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCEEFE),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Icon(
                          session.isBusy ? Icons.sync_rounded : Icons.autorenew_rounded,
                          color: const Color(0xFF4D87C4),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(strings.aiReplanTitle,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(
                              strings.aiReplanSubtitle,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(color: const Color(0xFF527194)),
                            ),
                          ],
                        ),
                      ),
                      _ActionChip(
                        label: strings.replan,
                        onTap: session.isBusy ? null : () => _showReplanDialog(context, session),
                      )
                    ],
                  ),
                ),
              if (caloriesConsumed > caloriesTarget * 0.7 && caloriesTarget > 0) const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Text(strings.todaysMeals, style: Theme.of(context).textTheme.titleLarge),
                    ),
                  ),
                  _RoundIconButton(
                    icon: Icons.auto_awesome_rounded,
                    color: PapipoTheme.primary,
                    onTap: session.isBusy ? null : () => _showReplanDialog(context, session),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ...meals.map((meal) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: PapipoClayCard(
                      child: Row(
                        children: [
                          const PapipoIconBadge(
                            icon: Icons.local_fire_department_outlined,
                            color: PapipoTheme.secondary,
                            size: 48,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        meal['name'] as String? ?? strings.todaysMeals,
                                        style: Theme.of(context).textTheme.bodyLarge,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF4F2F0),
                                        borderRadius: BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        strings.mealTypeLabel(meal['mealType'] as String? ?? ''),
                                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                              color: PapipoTheme.textMuted,
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                    )
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${meal['calories'] ?? 0} kcal • ${meal['protein'] ?? 0}g ${strings.protein}',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                if ((meal['reason'] as String?)?.isNotEmpty == true) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    'AI: ${meal['reason']}',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: PapipoTheme.primary,
                                          fontStyle: FontStyle.italic,
                                          fontSize: 12,
                                        ),
                                  ),
                                ]
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          if (_isMealLogged(mealLogs, meal))
                            Column(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF5DBB76), size: 24),
                                const SizedBox(height: 4),
                                Text(
                                  strings.logged,
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                        color: const Color(0xFF5A9C69),
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                              ],
                            )
                          else
                            _ActionChip(
                              label: strings.logMeal,
                              onTap: session.isBusy
                                  ? null
                                  : () => session.logMealFromPlan(mealPlanId: meal['id'] as String),
                            )
                        ],
                      ),
                    ),
                  )),
              if (analyzedMeal != null) ...[
                const SizedBox(height: 6),
                PapipoClayCard(
                  color: const Color(0xFFFFF7F1),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.camera_alt_outlined, color: Color(0xFFC98957)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              analyzedMeal['name'] as String? ?? strings.latestAnalysis,
                              style: Theme.of(context).textTheme.bodyLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              summary ?? strings.analyzedMealFallback,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),
              PapipoClayCard(
                color: const Color(0xFFFFF4EB),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFFCB8B4F), size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        strings.nutritionTip,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: const Color(0xFFA36E39),
                              height: 1.45,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  bool _isMealLogged(List<Map<String, dynamic>> mealLogs, Map<String, dynamic> meal) {
    final mealId = meal['id'];
    if (mealId == null) return false;
    return mealLogs.any((log) => log['mealPlanId'] == mealId);
  }

  Future<void> _showReplanDialog(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    final notesController = TextEditingController();
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
              Text(strings.replanRemainingMeals, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Container(
                decoration: PapipoTheme.clayInputDecoration(),
                child: TextField(
                  controller: notesController,
                  minLines: 3,
                  maxLines: 4,
                  decoration: PapipoTheme.inputDecoration(strings.notesForAiReplan),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: PapipoTheme.primaryButtonStyle(),
                  onPressed: () async {
                    try {
                      await session.replanMeals(notes: notesController.text);
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
    notesController.dispose();
  }

  Future<void> _pickAndAnalyzeMeal(BuildContext context, SessionController session) async {
    final strings = PapipoStrings.of(context);
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      backgroundColor: PapipoTheme.surface,
      builder: (context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: Text(strings.takePhoto),
                onTap: () => Navigator.of(context).pop(ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: Text(strings.chooseFromLibrary),
                onTap: () => Navigator.of(context).pop(ImageSource.gallery),
              ),
            ],
          ),
        );
      },
    );
    if (source == null) return;
    final file = await _imagePicker.pickImage(source: source, imageQuality: 72);
    if (file == null || !context.mounted) return;
    await _showAnalyzeDialog(context, session, file);
  }

  Future<void> _showAnalyzeDialog(BuildContext context, SessionController session, XFile file) async {
    final strings = PapipoStrings.of(context);
    final notesController = TextEditingController();
    String mealType = 'SNACK';
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
                    Text(strings.analyzeMealPhoto, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: mealType,
                      decoration: PapipoTheme.inputDecoration(strings.mealType),
                      items: const ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
                          .map((item) => DropdownMenuItem(value: item, child: Text(strings.mealTypeLabel(item))))
                          .toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setStateModal(() => mealType = value);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    Container(
                      decoration: PapipoTheme.clayInputDecoration(),
                      child: TextField(
                        controller: notesController,
                        minLines: 2,
                        maxLines: 3,
                        decoration: PapipoTheme.inputDecoration(strings.optionalNote),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: PapipoTheme.primaryButtonStyle(),
                        onPressed: () async {
                          try {
                            final bytes = await file.readAsBytes();
                            await session.analyzeMealPhoto(
                              fileName: file.name,
                              mimeType: _guessMimeType(file.name),
                              base64Data: base64Encode(bytes),
                              mealType: mealType,
                              notes: notesController.text,
                            );
                            if (!context.mounted) return;
                            Navigator.of(context).pop();
                          } on ApiException catch (error) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
                          }
                        },
                        child: Text(strings.analyzeAndLog),
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
    notesController.dispose();
  }

  String _guessMimeType(String fileName) {
    final lowered = fileName.toLowerCase();
    if (lowered.endsWith('.png')) return 'image/png';
    if (lowered.endsWith('.webp')) return 'image/webp';
    if (lowered.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }
}

class _MacroStat extends StatelessWidget {
  const _MacroStat({
    required this.label,
    required this.consumed,
    required this.target,
  });

  final String label;
  final int consumed;
  final int target;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        Text(
          '${consumed}g',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontSize: 15),
        ),
        Text(
          '/ ${target}g',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: PapipoTheme.textMuted),
        )
      ],
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
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
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: PapipoTheme.surface,
          borderRadius: BorderRadius.circular(999),
          boxShadow: PapipoTheme.clayRaisedShadow,
        ),
        child: Icon(icon, color: color, size: 22),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
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
        decoration: BoxDecoration(
          color: PapipoTheme.secondary,
          borderRadius: BorderRadius.circular(999),
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
