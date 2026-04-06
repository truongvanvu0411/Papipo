import 'package:flutter/material.dart';

import '../l10n/papipo_strings.dart';
import 'papipo_theme.dart';

class PapipoClayCard extends StatelessWidget {
  const PapipoClayCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.margin,
    this.color,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      margin: margin,
      padding: padding,
      decoration: PapipoTheme.softCardDecoration().copyWith(color: color ?? PapipoTheme.surface),
      child: child,
    );
    if (onTap == null) {
      return content;
    }
    return GestureDetector(onTap: onTap, child: content);
  }
}

class PapipoClayPanel extends StatelessWidget {
  const PapipoClayPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.color,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? PapipoTheme.bgBase,
        borderRadius: BorderRadius.circular(22),
        boxShadow: PapipoTheme.clayInsetShadow,
      ),
      child: child,
    );
  }
}

class PapipoLinearProgress extends StatelessWidget {
  const PapipoLinearProgress({
    super.key,
    required this.value,
    required this.max,
    this.fillColor = PapipoTheme.primary,
  });

  final double value;
  final double max;
  final Color fillColor;

  @override
  Widget build(BuildContext context) {
    final ratio = max <= 0 ? 0.0 : (value / max).clamp(0.0, 1.0);
    return PapipoClayPanel(
      padding: const EdgeInsets.all(4),
      child: SizedBox(
        height: 10,
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOut,
              width: MediaQuery.sizeOf(context).width * 0.72 * ratio,
              decoration: BoxDecoration(
                color: fillColor,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PapipoCircularProgress extends StatelessWidget {
  const PapipoCircularProgress({
    super.key,
    required this.value,
    this.max = 100,
    this.size = 106,
    this.strokeWidth = 11,
    this.color = PapipoTheme.primary,
  });

  final double value;
  final double max;
  final double size;
  final double strokeWidth;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final percentage = max <= 0 ? 0.0 : (value / max).clamp(0.0, 1.0);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: PapipoTheme.surface,
              borderRadius: BorderRadius.circular(999),
              boxShadow: PapipoTheme.clayRaisedShadow,
            ),
          ),
          Container(
            width: size * 0.7,
            height: size * 0.7,
            decoration: BoxDecoration(
              color: PapipoTheme.bgBase,
              borderRadius: BorderRadius.circular(999),
              boxShadow: PapipoTheme.clayInsetShadow,
            ),
          ),
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: percentage,
              strokeWidth: strokeWidth,
              backgroundColor: Colors.white.withValues(alpha: 0.38),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          Text(
            '${(percentage * 100).round()}%',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          )
        ],
      ),
    );
  }
}

class PapipoBottomNav extends StatelessWidget {
  const PapipoBottomNav({
    super.key,
    required this.currentIndex,
    required this.onChanged,
  });

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = PapipoStrings.of(context);
    final items = <({String label, IconData icon})>[
      (label: strings.today, icon: Icons.home_outlined),
      (label: strings.workout, icon: Icons.favorite_border),
      (label: strings.coach, icon: Icons.chat_bubble_outline),
      (label: strings.nutrition, icon: Icons.restaurant_outlined),
      (label: strings.profile, icon: Icons.person_outline),
    ];
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(18, 0, 18, 14),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: PapipoClayCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(items.length, (index) {
                final item = items[index];
                final selected = currentIndex == index;
                return GestureDetector(
                  onTap: () => onChanged(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? PapipoTheme.bgBase : Colors.transparent,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: selected ? PapipoTheme.clayInsetShadow : const [],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          size: 23,
                          color: selected ? PapipoTheme.primary : PapipoTheme.textMuted,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: selected ? PapipoTheme.primary : PapipoTheme.textMuted,
                                fontWeight: FontWeight.w800,
                              ),
                        )
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class PapipoIconBadge extends StatelessWidget {
  const PapipoIconBadge({
    super.key,
    required this.icon,
    required this.color,
    this.size = 46,
  });

  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: PapipoTheme.bgBase,
        borderRadius: BorderRadius.circular(size * 0.35),
        boxShadow: PapipoTheme.clayInsetShadow,
      ),
      child: Icon(icon, color: color, size: size * 0.52),
    );
  }
}
