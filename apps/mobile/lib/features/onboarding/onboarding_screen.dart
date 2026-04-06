import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _nameController = TextEditingController();
  final _ageController = TextEditingController(text: '25');
  final _heightController = TextEditingController(text: '170');
  final _weightController = TextEditingController(text: '65');

  int _step = 0;
  String _gender = 'MALE';
  String _activityLevel = 'moderate';
  String _planDuration = '30 days';
  String _targetTimeframe = '30 days';
  String _preferredLanguage = 'ja';
  int _targetWeightChange = -2;
  final Set<String> _goals = {'fat-loss'};
  final Set<String> _activityPrefs = {'walking', 'mobility'};
  String? _inlineError;

  static const _goalOptions = <_SelectableItem>[
    _SelectableItem(id: 'fat-loss', label: 'Fat Loss'),
    _SelectableItem(id: 'muscle', label: 'Build Muscle'),
    _SelectableItem(id: 'better-sleep', label: 'Sleep Better'),
    _SelectableItem(id: 'eat-clean', label: 'Eat Clean')
  ];

  static const _activityLevels = <_SelectableItem>[
    _SelectableItem(id: 'sedentary', label: 'Sedentary'),
    _SelectableItem(id: 'light', label: 'Light'),
    _SelectableItem(id: 'moderate', label: 'Moderate'),
    _SelectableItem(id: 'active', label: 'Active')
  ];

  static const _durationOptions = <_SelectableItem>[
    _SelectableItem(id: '14 days', label: '14 Days Kickstart'),
    _SelectableItem(id: '30 days', label: '30 Days Challenge'),
    _SelectableItem(id: '8 weeks', label: '8 Weeks Reset'),
    _SelectableItem(id: '12 weeks', label: '12 Weeks Lifestyle')
  ];

  static const _weightGoalOptions = <_WeightGoalItem>[
    _WeightGoalItem(value: -5, label: 'Lose 5kg'),
    _WeightGoalItem(value: -2, label: 'Lose 2kg'),
    _WeightGoalItem(value: 0, label: 'Maintain'),
    _WeightGoalItem(value: 2, label: 'Gain 2kg'),
    _WeightGoalItem(value: 5, label: 'Gain 5kg')
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _handleNext(SessionController session) async {
    setState(() {
      _inlineError = null;
    });

    if (_step == 0 && !_validateBasicStep(context)) {
      return;
    }

    if (_step == 1 && !_validateMetricsStep(context)) {
      return;
    }

    if (_step < 3) {
      setState(() {
        _step += 1;
      });
      return;
    }

    try {
      await session.completeOnboarding({
        'name': _nameController.text.trim(),
        'age': int.parse(_ageController.text.trim()),
        'gender': _gender,
        'heightCm': int.parse(_heightController.text.trim()),
        'weightKg': int.parse(_weightController.text.trim()),
        'goals': _goals.toList(),
        'activityLevel': _activityLevel,
        'planDuration': _planDuration,
        'targetWeightChangeKg': _targetWeightChange,
        'targetTimeframe': _targetTimeframe,
        'preferredLanguage': _preferredLanguage,
        'activityPrefs': _activityPrefs.toList(),
        'favoriteFoods': const []
      });
    } on ApiException catch (error) {
      setState(() {
        _inlineError = error.message;
      });
    } catch (error) {
      setState(() {
        _inlineError = '${PapipoStrings.of(context).onboardingFinishError} $error';
      });
    }
  }

  bool _validateBasicStep(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final age = int.tryParse(_ageController.text.trim());
    if (_nameController.text.trim().isEmpty) {
      setState(() {
        _inlineError = strings.onboardingInvalidName;
      });
      return false;
    }
    if (age == null || age < 13) {
      setState(() {
        _inlineError = strings.onboardingInvalidAge;
      });
      return false;
    }
    return true;
  }

  bool _validateMetricsStep(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final height = int.tryParse(_heightController.text.trim());
    final weight = int.tryParse(_weightController.text.trim());
    if (height == null || height < 100) {
      setState(() {
        _inlineError = strings.onboardingInvalidHeight;
      });
      return false;
    }
    if (weight == null || weight < 30) {
      setState(() {
        _inlineError = strings.onboardingInvalidWeight;
      });
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(color: PapipoTheme.bgBase),
            child: Stack(
              children: [
                const _SoftBackdrop(),
                SafeArea(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 460),
                        child: Column(
                          children: [
                            Text(
                              'Sooti Wellness',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                    fontSize: 34,
                                    fontWeight: FontWeight.w800
                                  ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              strings.onboardingSubtitle,
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w600
                                  ),
                            ),
                            const SizedBox(height: 28),
                            Container(
                              decoration: PapipoTheme.softCardDecoration(),
                              padding: const EdgeInsets.fromLTRB(26, 26, 26, 22),
                              child: SizedBox(
                                height: 400,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _stepTitle(strings),
                                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                            fontSize: 24
                                          ),
                                    ),
                                    const SizedBox(height: 22),
                                    Expanded(
                                      child: AnimatedSwitcher(
                                        duration: const Duration(milliseconds: 220),
                                        child: KeyedSubtree(
                                          key: ValueKey(_step),
                                          child: _StepFrame(
                                            child: _buildStepContent(context),
                                          ),
                                        ),
                                      ),
                                    ),
                                    if (_inlineError != null || session.errorMessage != null) ...[
                                      const SizedBox(height: 12),
                                      Text(
                                        _inlineError ?? session.errorMessage!,
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: const Color(0xFFB55243),
                                              fontWeight: FontWeight.w800
                                            ),
                                      ),
                                    ],
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        ...List.generate(4, (index) {
                                          final active = index <= _step;
                                          return Container(
                                            width: 9,
                                            height: 9,
                                            margin: EdgeInsets.only(right: index == 3 ? 0 : 8),
                                            decoration: BoxDecoration(
                                              color: active
                                                  ? PapipoTheme.primary
                                                  : PapipoTheme.textMuted.withValues(alpha: 0.28),
                                              borderRadius: BorderRadius.circular(999),
                                            ),
                                          );
                                        }),
                                        const Spacer(),
                                        if (_step > 0)
                                          TextButton(
                                            onPressed: session.isBusy
                                                ? null
                                                : () => setState(() {
                                                      _inlineError = null;
                                                      _step -= 1;
                                                    }),
                                            child: Text(
                                              strings.back,
                                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                                    color: PapipoTheme.textMuted
                                                  ),
                                            ),
                                          ),
                                        const SizedBox(width: 10),
                                        GestureDetector(
                                          onTap: session.isBusy ? null : () => _handleNext(session),
                                          child: AnimatedOpacity(
                                            duration: const Duration(milliseconds: 160),
                                            opacity: session.isBusy ? 0.68 : 1,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 24,
                                                vertical: 14,
                                              ),
                                              decoration: PapipoTheme.floatingAccentDecoration(),
                                              child: Text(
                                                session.isBusy
                                                    ? '...'
                                                    : _step == 3
                                                        ? strings.createPlan
                                                        : strings.next,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  ],
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _stepTitle(PapipoStrings strings) {
    switch (_step) {
      case 0:
        return strings.basicInformation;
      case 1:
        return strings.bodyMetrics;
      case 2:
        return strings.goalsAndActivity;
      default:
        return strings.planSetup;
    }
  }

  Widget _buildStepContent(BuildContext context) {
    final strings = PapipoStrings.of(context);
    switch (_step) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _FieldLabel(label: strings.nameLabel),
            const SizedBox(height: 8),
            _ClayInputField(
              controller: _nameController,
              hintText: strings.nameHint,
            ),
            const SizedBox(height: 18),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _FieldLabel(label: strings.ageLabel),
                      const SizedBox(height: 8),
                      _ClayInputField(
                        controller: _ageController,
                        hintText: '25',
                        keyboardType: TextInputType.number,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _FieldLabel(label: strings.genderLabel),
                      const SizedBox(height: 8),
                      _ClaySelectField<String>(
                        value: _gender,
                        items: {
                          'MALE': strings.genderText('MALE'),
                          'FEMALE': strings.genderText('FEMALE'),
                          'OTHER': strings.genderText('OTHER'),
                        },
                        onChanged: (value) => setState(() => _gender = value),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _FieldLabel(label: strings.heightLabel),
            const SizedBox(height: 8),
            _ClayInputField(
              controller: _heightController,
              hintText: '170 cm',
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 18),
            _FieldLabel(label: strings.weightLabel),
            const SizedBox(height: 8),
            _ClayInputField(
              controller: _weightController,
              hintText: '65 kg',
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 18),
            Text(
              strings.bodyMetricsHelp,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.4),
            ),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.goalsHelp,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _goalOptions.map((goal) {
                final isSelected = _goals.contains(goal.id);
                return _SelectionTile(
                  label: strings.goalLabel(goal.id),
                  selected: isSelected,
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _goals.remove(goal.id);
                      } else {
                        _goals.add(goal.id);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 22),
            Text(
              strings.activityLevel,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _activityLevels.map((level) {
                return _MiniPill(
                  label: strings.activityLevelLabel(level.id),
                  selected: _activityLevel == level.id,
                  onTap: () => setState(() => _activityLevel = level.id),
                );
              }).toList(),
            ),
          ],
        );
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.planDuration,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            ..._durationOptions.map((duration) {
              final selected = _planDuration == duration.id;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _WideSelectRow(
                  label: strings.durationLabel(duration.id),
                  selected: selected,
                  onTap: () => setState(() {
                    _planDuration = duration.id;
                    _targetTimeframe = duration.id;
                  }),
                ),
              );
            }),
            const SizedBox(height: 10),
            Text(
              strings.weightGoal,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _weightGoalOptions.map((weightGoal) {
                return _MiniPill(
                  label: strings.weightGoalLabel(weightGoal.value),
                  selected: _targetWeightChange == weightGoal.value,
                  onTap: () => setState(() => _targetWeightChange = weightGoal.value),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            _LanguageChooser(
              selectedLanguage: _preferredLanguage,
              onChanged: (value) => setState(() => _preferredLanguage = value),
            ),
          ],
        );
    }
  }
}

class _StepFrame extends StatelessWidget {
  const _StepFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: child,
    );
  }
}

class _SoftBackdrop extends StatelessWidget {
  const _SoftBackdrop();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(
            top: 110,
            left: 40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(999),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33FFFFFF),
                    blurRadius: 80,
                    spreadRadius: 18,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 32,
            bottom: 120,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                color: PapipoTheme.primarySoft.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: PapipoTheme.textMuted,
          ),
    );
  }
}

class _ClayInputField extends StatelessWidget {
  const _ClayInputField({
    required this.controller,
    required this.hintText,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String hintText;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: PapipoTheme.clayInputDecoration(),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
        decoration: PapipoTheme.inputDecoration(hintText),
      ),
    );
  }
}

class _ClaySelectField<T> extends StatelessWidget {
  const _ClaySelectField({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final T value;
  final Map<T, String> items;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: PapipoTheme.clayInputDecoration(),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          dropdownColor: PapipoTheme.surface,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: PapipoTheme.textMuted),
          items: items.entries
              .map(
                (entry) => DropdownMenuItem<T>(
                  value: entry.key,
                  child: Text(entry.value),
                ),
              )
              .toList(),
          onChanged: (selected) {
            if (selected != null) {
              onChanged(selected);
            }
          },
        ),
      ),
    );
  }
}

class _SelectionTile extends StatelessWidget {
  const _SelectionTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 170),
        width: 148,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? PapipoTheme.bgBase : PapipoTheme.surface,
          borderRadius: BorderRadius.circular(22),
          boxShadow: selected
              ? PapipoTheme.clayInsetShadow
              : PapipoTheme.clayRaisedShadow,
          border: Border.all(color: Colors.white.withValues(alpha: 0.5)),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: selected ? PapipoTheme.primary : PapipoTheme.textMuted,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
    );
  }
}

class _MiniPill extends StatelessWidget {
  const _MiniPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? PapipoTheme.bgBase : PapipoTheme.surface,
          borderRadius: BorderRadius.circular(18),
          boxShadow: selected
              ? PapipoTheme.clayInsetShadow
              : PapipoTheme.clayRaisedShadow,
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: selected ? PapipoTheme.primary : PapipoTheme.textMain,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
    );
  }
}

class _WideSelectRow extends StatelessWidget {
  const _WideSelectRow({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 170),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? PapipoTheme.bgBase : PapipoTheme.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected
              ? PapipoTheme.clayInsetShadow
              : PapipoTheme.clayRaisedShadow,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: selected ? PapipoTheme.primary : PapipoTheme.textMain,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
    );
  }
}

class _LanguageChooser extends StatelessWidget {
  const _LanguageChooser({
    required this.selectedLanguage,
    required this.onChanged,
  });

  final String selectedLanguage;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final languageLabels = <String, String>{
      'ja': strings.languageName('ja'),
      'vi': strings.languageName('vi'),
      'en': strings.languageName('en'),
    };

    return Row(
      children: [
        Text(
          strings.language,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const Spacer(),
        _ClaySelectField<String>(
          value: selectedLanguage,
          items: languageLabels,
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _SelectableItem {
  const _SelectableItem({
    required this.id,
    required this.label,
  });

  final String id;
  final String label;
}

class _WeightGoalItem {
  const _WeightGoalItem({
    required this.value,
    required this.label,
  });

  final int value;
  final String label;
}
