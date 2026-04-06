import 'package:flutter/material.dart';

class PapipoTheme {
  static const Color bgBase = Color(0xFFF4ECE6);
  static const Color surface = Color(0xFFFDFaf7);
  static const Color primary = Color(0xFFF2BBA7);
  static const Color primarySoft = Color(0xFFF7CDBD);
  static const Color secondary = Color(0xFFA8CCE3);
  static const Color accent = Color(0xFFF5D0C9);
  static const Color textMain = Color(0xFF5A504B);
  static const Color textMuted = Color(0xFF9E938E);
  static const Color shadowDark = Color(0xFFE0D6CF);
  static const Color shadowLight = Color(0xFFFFFFFF);

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: bgBase,
      dividerColor: const Color(0xFFE7DDD6),
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        surface: surface
      ),
      fontFamily: 'Nunito',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: textMain,
          fontSize: 32,
          fontWeight: FontWeight.w800
        ),
        titleLarge: TextStyle(
          color: textMain,
          fontSize: 22,
          fontWeight: FontWeight.w800
        ),
        bodyLarge: TextStyle(
          color: textMain,
          fontSize: 16,
          fontWeight: FontWeight.w600
        ),
        bodyMedium: TextStyle(
          color: textMuted,
          fontSize: 14,
          fontWeight: FontWeight.w600
        ),
        labelLarge: TextStyle(
          color: textMuted,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4
        )
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24)
        )
      )
    );
  }

  static BoxDecoration softCardDecoration() {
    return BoxDecoration(
      color: surface,
      borderRadius: BorderRadius.circular(28),
      boxShadow: const [
        BoxShadow(
          color: shadowLight,
          blurRadius: 22,
          offset: Offset(-10, -10)
        ),
        BoxShadow(
          color: shadowDark,
          blurRadius: 22,
          offset: Offset(10, 10)
        )
      ],
      border: Border.all(color: const Color(0xFFFFFEFC), width: 1.1)
    );
  }

  static BoxDecoration secondaryCardDecoration() {
    return BoxDecoration(
      color: const Color(0xFFFFF3EE),
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: const Color(0xFFF2DACF))
    );
  }

  static List<BoxShadow> get clayRaisedShadow => const [
        BoxShadow(
          color: shadowLight,
          blurRadius: 10,
          offset: Offset(-4, -4)
        ),
        BoxShadow(
          color: shadowDark,
          blurRadius: 12,
          offset: Offset(4, 4)
        )
      ];

  static List<BoxShadow> get clayInsetShadow => const [
        BoxShadow(
          color: Color(0xFFF8F2EE),
          blurRadius: 8,
          offset: Offset(-3, -3)
        ),
        BoxShadow(
          color: Color(0xFFE6DBD4),
          blurRadius: 10,
          offset: Offset(4, 4)
        )
      ];

  static BoxDecoration clayInputDecoration() {
    return BoxDecoration(
      color: bgBase,
      borderRadius: BorderRadius.circular(18),
      boxShadow: clayInsetShadow,
      border: Border.all(color: Colors.white.withValues(alpha: 0.55), width: 1)
    );
  }

  static InputDecoration inputDecoration(String hintText) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(
        color: textMuted,
        fontWeight: FontWeight.w600
      ),
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      focusedErrorBorder: InputBorder.none,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16)
    );
  }

  static ButtonStyle primaryButtonStyle() {
    return FilledButton.styleFrom(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      shadowColor: shadowDark,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999)
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w800
      )
    );
  }

  static BoxDecoration floatingAccentDecoration() {
    return BoxDecoration(
      color: primary,
      borderRadius: BorderRadius.circular(999),
      boxShadow: const [
        BoxShadow(
          color: Color(0x40F4BCA9),
          blurRadius: 0,
          spreadRadius: 3
        ),
        BoxShadow(
          color: shadowLight,
          blurRadius: 12,
          offset: Offset(-4, -4)
        ),
        BoxShadow(
          color: shadowDark,
          blurRadius: 14,
          offset: Offset(6, 6)
        )
      ]
    );
  }
}
