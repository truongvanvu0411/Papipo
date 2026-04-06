import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isSignup = false;
  String? _inlineError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit(SessionController session) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _inlineError = null;
    });

    try {
      if (_isSignup) {
        await session.register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: _nameController.text.trim().isEmpty ? null : _nameController.text.trim(),
        );
      } else {
        await session.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      }
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _inlineError = error.message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _inlineError = '${PapipoStrings.of(context).authGenericError} $error';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    return Consumer<SessionController>(
      builder: (context, session, child) {
        return Scaffold(
          body: Container(
            color: PapipoTheme.bgBase,
            child: Stack(
              children: [
                const _AuthBackdrop(),
                SafeArea(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 460),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              Text(
                                strings.appTitle,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _isSignup
                                    ? strings.createAccountSubtitle
                                    : strings.authSubtitle,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              const SizedBox(height: 28),
                              Container(
                                decoration: PapipoTheme.softCardDecoration(),
                                padding: const EdgeInsets.fromLTRB(26, 24, 26, 24),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _ModeButton(
                                            label: strings.login,
                                            isSelected: !_isSignup,
                                            onTap: () => setState(() => _isSignup = false),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: _ModeButton(
                                            label: strings.signUp,
                                            isSelected: _isSignup,
                                            onTap: () => setState(() => _isSignup = true),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 24),
                                    AnimatedSwitcher(
                                      duration: const Duration(milliseconds: 180),
                                      child: Column(
                                        key: ValueKey(_isSignup),
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (_isSignup) ...[
                                            _FieldLabel(label: strings.nameLabel),
                                            const SizedBox(height: 8),
                                            _ClayInput(
                                              controller: _nameController,
                                              hintText: strings.nameHint,
                                              validator: (value) {
                                                if (!_isSignup) {
                                                  return null;
                                                }
                                                if (value == null || value.trim().isEmpty) {
                                                  return strings.authNameRequired;
                                                }
                                                return null;
                                              },
                                            ),
                                            const SizedBox(height: 18),
                                          ],
                                          _FieldLabel(label: strings.emailLabel),
                                          const SizedBox(height: 8),
                                          _ClayInput(
                                            controller: _emailController,
                                            hintText: strings.emailHint,
                                            keyboardType: TextInputType.emailAddress,
                                            validator: (value) {
                                              if (value == null ||
                                                  value.trim().isEmpty ||
                                                  !value.contains('@')) {
                                                return strings.authEmailInvalid;
                                              }
                                              return null;
                                            },
                                          ),
                                          const SizedBox(height: 18),
                                          _FieldLabel(label: strings.passwordLabel),
                                          const SizedBox(height: 8),
                                          _ClayInput(
                                            controller: _passwordController,
                                            hintText: strings.passwordHint,
                                            obscureText: true,
                                            validator: (value) {
                                              if (value == null || value.length < 8) {
                                                return strings.authPasswordInvalid;
                                              }
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (_inlineError != null || session.errorMessage != null) ...[
                                      const SizedBox(height: 16),
                                      Text(
                                        _inlineError ?? session.errorMessage!,
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: const Color(0xFFB55243),
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                    ],
                                    const SizedBox(height: 24),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            _isSignup
                                                ? strings.alreadyHaveAccount
                                                : strings.needAccount,
                                            style: Theme.of(context).textTheme.bodyMedium,
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () => setState(() => _isSignup = !_isSignup),
                                          child: Text(
                                            _isSignup ? strings.login : strings.signUp,
                                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                                  color: PapipoTheme.primary,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: GestureDetector(
                                        onTap: session.isBusy ? null : () => _submit(session),
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
                                                  : _isSignup
                                                      ? strings.createAccount
                                                      : strings.continueLabel,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 16,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
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
}

class _AuthBackdrop extends StatelessWidget {
  const _AuthBackdrop();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(
            top: 120,
            left: 36,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(999),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x2AFFFFFF),
                    blurRadius: 70,
                    spreadRadius: 16,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 28,
            top: 220,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: PapipoTheme.primarySoft.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          color: isSelected ? PapipoTheme.primary : PapipoTheme.surface,
          borderRadius: BorderRadius.circular(999),
          boxShadow: isSelected
              ? PapipoTheme.clayRaisedShadow
              : const [
                  BoxShadow(
                    color: Color(0x15FFFFFF),
                    blurRadius: 6,
                    offset: Offset(-2, -2),
                  ),
                ],
        ),
        child: Center(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: isSelected ? Colors.white : PapipoTheme.textMain,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
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

class _ClayInput extends StatelessWidget {
  const _ClayInput({
    required this.controller,
    required this.hintText,
    this.keyboardType,
    this.obscureText = false,
    this.validator,
  });

  final TextEditingController controller;
  final String hintText;
  final TextInputType? keyboardType;
  final bool obscureText;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: PapipoTheme.clayInputDecoration(),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        validator: validator,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
        decoration: PapipoTheme.inputDecoration(hintText),
      ),
    );
  }
}
