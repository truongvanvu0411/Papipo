import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_clay.dart';
import '../../theme/papipo_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  bool _showRewardsHelp = false;

  final _nameController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _ageController = TextEditingController();
  String _gender = 'OTHER';
  String _preferredLanguage = 'ja';
  String? _loadedProfileId;

  @override
  void dispose() {
    _nameController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  void _syncControllers(Map<String, dynamic>? response) {
    final profile = response?['profile'];
    final id = response?['id'];
    if (profile is! Map<String, dynamic> || id is! String || id == _loadedProfileId) {
      return;
    }
    _loadedProfileId = id;
    _nameController.text = (profile['name'] as String?) ?? '';
    _heightController.text = profile['heightCm']?.toString() ?? '';
    _weightController.text = profile['weightKg']?.toString() ?? '';
    _ageController.text = profile['age']?.toString() ?? '';
    _gender = (profile['gender'] as String?) ?? 'OTHER';
    _preferredLanguage = (profile['preferredLanguage'] as String?) ?? 'ja';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        _syncControllers(session.profileResponse);
        final profile = session.profileResponse?['profile'] as Map<String, dynamic>?;
        final rewards = session.profileResponse?['rewards'] as Map<String, dynamic>?;
        final badges = (rewards?['badges'] as List? ?? const <dynamic>[])
            .cast<Map<String, dynamic>>();
        final gems = (rewards?['gems'] as num?)?.toInt() ?? 0;

        return Stack(
          children: [
            ListView(
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(strings.profile, style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30)),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isEditing = !_isEditing),
                      child: const PapipoIconBadge(
                        icon: Icons.settings_outlined,
                        color: PapipoTheme.textMuted,
                        size: 42,
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 22),
                Column(
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            color: PapipoTheme.bgBase,
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: PapipoTheme.clayRaisedShadow,
                            border: Border.all(color: PapipoTheme.surface, width: 4),
                          ),
                          child: const Icon(Icons.person_outline_rounded, size: 42, color: PapipoTheme.textMuted),
                        ),
                        Positioned(
                          right: -2,
                          bottom: -2,
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: PapipoTheme.primary,
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: PapipoTheme.clayRaisedShadow,
                            ),
                            child: const Icon(Icons.emoji_events_outlined, size: 18, color: Colors.white),
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      (profile?['name'] as String?)?.isNotEmpty == true ? profile!['name'] as String : strings.userFallback,
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(
                            color: const Color(0x33F4D25E),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.bolt_rounded, size: 14, color: Color(0xFFAF7C00)),
                              const SizedBox(width: 4),
                              Text(
                                strings.gemsLabel(gems),
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      color: const Color(0xFFAF7C00),
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          strings.premiumMember,
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                letterSpacing: 0.8,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Text(strings.rewards, style: Theme.of(context).textTheme.titleLarge),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _showRewardsHelp = true),
                      child: const Icon(Icons.info_outline_rounded, size: 18, color: PapipoTheme.textMuted),
                    )
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 112,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: badges.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 16),
                    itemBuilder: (context, index) {
                      final badge = badges[index];
                      final unlocked = badge['unlocked'] == true;
                      return SizedBox(
                        width: 82,
                        child: Column(
                          children: [
                            Container(
                              width: 66,
                              height: 66,
                              decoration: BoxDecoration(
                                color: unlocked ? Colors.white : const Color(0xFFE7E0DB),
                                borderRadius: BorderRadius.circular(999),
                                boxShadow: PapipoTheme.clayRaisedShadow,
                              ),
                              child: Icon(
                                _badgeIcon(badge['code'] as String? ?? ''),
                                color: _badgeColor(badge['code'] as String? ?? ''),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              strings.badgeName(badge['code'] as String? ?? ''),
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: unlocked ? PapipoTheme.textMain : PapipoTheme.textMuted,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Text(strings.personalInfo, style: Theme.of(context).textTheme.titleLarge),
                ),
                const SizedBox(height: 14),
                GridView(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                    childAspectRatio: 1.1,
                  ),
                  children: [
                    _MetricEditCard(
                      icon: Icons.height_rounded,
                      label: strings.heightLabel,
                      suffix: 'cm',
                      editing: _isEditing,
                      controller: _heightController,
                      display: profile?['heightCm']?.toString() ?? '--',
                    ),
                    _MetricEditCard(
                      icon: Icons.monitor_weight_outlined,
                      label: strings.weightLabel,
                      suffix: 'kg',
                      editing: _isEditing,
                      controller: _weightController,
                      display: profile?['weightKg']?.toString() ?? '--',
                    ),
                    _MetricEditCard(
                      icon: Icons.calendar_month_outlined,
                      label: strings.ageLabel,
                      editing: _isEditing,
                      controller: _ageController,
                      display: profile?['age']?.toString() ?? '--',
                    ),
                    _GenderCard(
                      editing: _isEditing,
                      gender: _gender,
                      onChanged: (value) => setState(() => _gender = value),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Text(strings.settings, style: Theme.of(context).textTheme.titleLarge),
                ),
                const SizedBox(height: 14),
                PapipoClayCard(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: [
                      _SettingsRow(
                        icon: Icons.language_rounded,
                        label: strings.language,
                        trailingText: strings.languageName(_preferredLanguage),
                        onTap: () => setState(() {
                          const langs = ['ja', 'vi', 'en'];
                          final currentIndex = langs.indexOf(_preferredLanguage);
                          _preferredLanguage = langs[(currentIndex + 1) % langs.length];
                        }),
                      ),
                      _SettingsRow(
                        icon: Icons.favorite_outline_rounded,
                        label: strings.workoutPrefs,
                        onTap: null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                if (_isEditing)
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: PapipoTheme.primaryButtonStyle(),
                      onPressed: session.isBusy ? null : () => _save(session),
                      child: Text(session.isBusy ? strings.saving : strings.saveProfile),
                    ),
                  ),
                if (_isEditing) const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: session.isBusy ? null : session.logout,
                    icon: const Icon(Icons.logout_rounded),
                    label: Text(strings.signOut),
                  ),
                ),
              ],
            ),
            if (_showRewardsHelp)
              _RewardsOverlay(
                onClose: () => setState(() => _showRewardsHelp = false),
              )
          ],
        );
      },
    );
  }

  Future<void> _save(SessionController session) async {
    try {
      await session.updateProfile({
        'name': _nameController.text.trim().isEmpty ? null : _nameController.text.trim(),
        'heightCm': int.tryParse(_heightController.text.trim()),
        'weightKg': int.tryParse(_weightController.text.trim()),
        'age': int.tryParse(_ageController.text.trim()),
        'gender': _gender,
        'preferredLanguage': _preferredLanguage,
      });
    } on ApiException catch (_) {
      rethrow;
    }
  }

  IconData _badgeIcon(String code) {
    if (code.contains('water')) return Icons.water_drop_outlined;
    if (code.contains('consistency')) return Icons.bolt_rounded;
    return Icons.balance_outlined;
  }

  Color _badgeColor(String code) {
    if (code.contains('water')) return const Color(0xFF4A96C6);
    if (code.contains('consistency')) return const Color(0xFFC98D00);
    return const Color(0xFF5FA16E);
  }
}

class _MetricEditCard extends StatelessWidget {
  const _MetricEditCard({
    required this.icon,
    required this.label,
    required this.editing,
    required this.controller,
    required this.display,
    this.suffix,
  });

  final IconData icon;
  final String label;
  final bool editing;
  final TextEditingController controller;
  final String display;
  final String? suffix;

  @override
  Widget build(BuildContext context) {
    return PapipoClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: PapipoTheme.textMuted),
              const SizedBox(width: 6),
              Text(label, style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
          const Spacer(),
          if (editing)
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                isDense: true,
                border: UnderlineInputBorder(
                  borderSide: BorderSide(color: PapipoTheme.primary),
                ),
              ),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 24),
            )
          else
            RichText(
              text: TextSpan(
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 26),
                children: [
                  TextSpan(text: display),
                  if (suffix != null)
                    TextSpan(
                      text: ' $suffix',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _GenderCard extends StatelessWidget {
  const _GenderCard({
    required this.editing,
    required this.gender,
    required this.onChanged,
  });

  final bool editing;
  final String gender;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    return PapipoClayCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person_outline_rounded, size: 16, color: PapipoTheme.textMuted),
              const SizedBox(width: 6),
              Text(strings.genderLabel, style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
          const Spacer(),
          if (editing)
            DropdownButton<String>(
              value: gender,
              isExpanded: true,
              underline: const SizedBox.shrink(),
              items: [
                DropdownMenuItem(value: 'MALE', child: Text(strings.genderText('MALE'))),
                DropdownMenuItem(value: 'FEMALE', child: Text(strings.genderText('FEMALE'))),
                DropdownMenuItem(value: 'OTHER', child: Text(strings.genderText('OTHER'))),
              ],
              onChanged: (value) {
                if (value != null) onChanged(value);
              },
            )
          else
            Text(
              strings.genderText(gender),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 26),
            ),
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailingText,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final String? trailingText;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        child: Row(
          children: [
            PapipoClayPanel(
              padding: const EdgeInsets.all(10),
              child: Icon(icon, size: 18, color: PapipoTheme.textMuted),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyLarge)),
            if (trailingText != null)
              Text(
                trailingText!,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: PapipoTheme.primary,
                    ),
              ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded, color: PapipoTheme.textMuted),
          ],
        ),
      ),
    );
  }
}

class _RewardsOverlay extends StatelessWidget {
  const _RewardsOverlay({required this.onClose});

  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
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
                  Text(strings.aboutRewards, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  Text(
                    strings.rewardsHelpBody,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: PapipoTheme.primaryButtonStyle(),
                      onPressed: onClose,
                      child: Text(strings.gotIt),
                    ),
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
