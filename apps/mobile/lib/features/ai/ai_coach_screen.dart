import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../l10n/papipo_strings.dart';
import '../../theme/papipo_clay.dart';
import '../../theme/papipo_theme.dart';

class AiCoachScreen extends StatefulWidget {
  const AiCoachScreen({super.key});

  @override
  State<AiCoachScreen> createState() => _AiCoachScreenState();
}

class _AiCoachScreenState extends State<AiCoachScreen> {
  final TextEditingController _messageController = TextEditingController();
  bool _requested = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final session = context.read<SessionController>();
      if (!session.isAuthenticated) return;
      await session.loadAiConversations();
      final activeId = session.activeConversationId;
      if (activeId != null) {
        await session.loadAiMessages(activeId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, child) {
        final strings = PapipoStrings.of(context);
        return Column(
          children: [
            Row(
              children: [
                const PapipoIconBadge(
                  icon: Icons.smart_toy_outlined,
                  color: PapipoTheme.primary,
                  size: 50,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.isJa ? 'AIコーチ' : strings.isVi ? 'AI Coach' : 'AI Coach',
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        strings.coachSubtitle,
                        style: Theme.of(context).textTheme.bodyMedium,
                      )
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            Expanded(
              child: PapipoClayPanel(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (session.aiMessages.isEmpty)
                      Expanded(
                        child: Align(
                          alignment: Alignment.topLeft,
                          child: PapipoClayCard(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              strings.coachWelcome,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45),
                            ),
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ListView.builder(
                          reverse: false,
                          itemCount: session.aiMessages.length,
                          itemBuilder: (context, index) {
                            final message = session.aiMessages[index];
                            return _MessageBubble(message: message);
                          },
                        ),
                      ),
                    if (session.isBusy)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(top: 8, bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: PapipoTheme.surface,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: PapipoTheme.clayRaisedShadow,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              _TypingDot(delay: 0),
                              SizedBox(width: 6),
                              _TypingDot(delay: 120),
                              SizedBox(width: 6),
                              _TypingDot(delay: 240),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: PapipoTheme.clayInputDecoration(),
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 4,
                      decoration: PapipoTheme.inputDecoration(strings.askCoach),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: session.isBusy ? null : () => _sendMessage(session),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                    decoration: PapipoTheme.floatingAccentDecoration(),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
            if (session.errorMessage != null) ...[
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  session.errorMessage!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFFB55243),
                        fontWeight: FontWeight.w800,
                      ),
                ),
              )
            ]
          ],
        );
      },
    );
  }

  Future<void> _sendMessage(SessionController session) async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    try {
      await session.sendCoachMessage(text);
      _messageController.clear();
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final Map<String, dynamic> message;

  @override
  Widget build(BuildContext context) {
    final isUser = message['role'] == 'USER';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        constraints: const BoxConstraints(maxWidth: 320),
        decoration: BoxDecoration(
          color: isUser ? PapipoTheme.primary : PapipoTheme.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(24),
            topRight: const Radius.circular(24),
            bottomLeft: Radius.circular(isUser ? 24 : 8),
            bottomRight: Radius.circular(isUser ? 8 : 24),
          ),
          boxShadow: isUser ? const [] : PapipoTheme.clayRaisedShadow,
        ),
        child: Text(
          message['content'] as String? ?? '',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: isUser ? Colors.white : PapipoTheme.textMain,
                height: 1.45,
              ),
        ),
      ),
    );
  }
}

class _TypingDot extends StatefulWidget {
  const _TypingDot({required this.delay});

  final int delay;

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
      lowerBound: 0.4,
      upperBound: 1,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: PapipoTheme.textMuted,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
