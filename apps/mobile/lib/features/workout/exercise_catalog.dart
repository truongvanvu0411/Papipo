import 'package:flutter/material.dart';

class ExerciseVisualSpec {
  const ExerciseVisualSpec({
    required this.title,
    required this.subtitle,
    required this.coachCue,
    required this.icon,
    required this.background,
    required this.foreground
  });

  final String title;
  final String subtitle;
  final String coachCue;
  final IconData icon;
  final Color background;
  final Color foreground;
}

const Map<String, ExerciseVisualSpec> papipoExerciseCatalog = {
  'goblet-squat': ExerciseVisualSpec(
    title: 'Lower Body Strength',
    subtitle: 'Sit tall, brace, then drive through the floor.',
    coachCue: 'Keep ribs stacked over hips and let the knees travel naturally.',
    icon: Icons.fitness_center,
    background: Color(0xFFF7D9B0),
    foreground: Color(0xFF8C4B1F)
  ),
  'push-up': ExerciseVisualSpec(
    title: 'Upper Body Push',
    subtitle: 'Stay long from head to heel and press the floor away.',
    coachCue: 'Exhale through the press and keep the neck relaxed.',
    icon: Icons.pan_tool_alt,
    background: Color(0xFFD8E6FF),
    foreground: Color(0xFF244B84)
  ),
  'dumbbell-row': ExerciseVisualSpec(
    title: 'Back and Posture',
    subtitle: 'Pull the elbow toward the back pocket, not the shoulder.',
    coachCue: 'Pause for one count at the top to own the position.',
    icon: Icons.north_west,
    background: Color(0xFFDDF4E4),
    foreground: Color(0xFF2E6A49)
  ),
  'front-plank': ExerciseVisualSpec(
    title: 'Core Stability',
    subtitle: 'Build tension through the trunk instead of chasing time.',
    coachCue: 'Squeeze glutes lightly and keep a long line through the spine.',
    icon: Icons.horizontal_rule,
    background: Color(0xFFF6E0F1),
    foreground: Color(0xFF7A3C74)
  ),
  'worlds-greatest-stretch': ExerciseVisualSpec(
    title: 'Mobility Reset',
    subtitle: 'Move slowly and breathe into each range.',
    coachCue: 'Treat this as mobility quality work, not a race.',
    icon: Icons.self_improvement,
    background: Color(0xFFFFE8C9),
    foreground: Color(0xFFA05C16)
  ),
  'glute-bridge': ExerciseVisualSpec(
    title: 'Posterior Chain Activation',
    subtitle: 'Lift with your hips while keeping ribs quiet.',
    coachCue: 'Pause at the top and feel the glutes do the work.',
    icon: Icons.expand_less,
    background: Color(0xFFDCEAFB),
    foreground: Color(0xFF2D5F91)
  ),
  'bird-dog': ExerciseVisualSpec(
    title: 'Cross-Body Control',
    subtitle: 'Reach long without twisting through the torso.',
    coachCue: 'Keep the pelvis still and move with slow control.',
    icon: Icons.gesture,
    background: Color(0xFFE3F3D9),
    foreground: Color(0xFF406D2B)
  ),
  'dead-bug': ExerciseVisualSpec(
    title: 'Deep Core Patterning',
    subtitle: 'Keep the low back quiet while limbs extend.',
    coachCue: 'Only lower the limbs as far as you can stay braced.',
    icon: Icons.accessibility_new,
    background: Color(0xFFFCE1D8),
    foreground: Color(0xFF9A4B38)
  ),
  'brisk-walk': ExerciseVisualSpec(
    title: 'Cardio Base',
    subtitle: 'Find a pace that lifts breathing without losing control.',
    coachCue: 'Keep shoulders relaxed and let the arms swing naturally.',
    icon: Icons.directions_walk,
    background: Color(0xFFE7F5EF),
    foreground: Color(0xFF26745A)
  ),
  'step-up': ExerciseVisualSpec(
    title: 'Single-Leg Strength',
    subtitle: 'Drive through the full foot and finish tall.',
    coachCue: 'Control the lowering phase just as much as the step up.',
    icon: Icons.stairs,
    background: Color(0xFFFFE6D1),
    foreground: Color(0xFF9B5621)
  ),
  'bodyweight-squat': ExerciseVisualSpec(
    title: 'Movement Quality',
    subtitle: 'Use smooth reps to open hips and knees.',
    coachCue: 'Keep the whole foot grounded as you stand.',
    icon: Icons.accessibility,
    background: Color(0xFFDDE8FF),
    foreground: Color(0xFF365B98)
  ),
  'mountain-climber': ExerciseVisualSpec(
    title: 'Conditioning Burst',
    subtitle: 'Stay stacked over the hands and move crisply.',
    coachCue: 'Keep hips lower than you think and breathe rhythmically.',
    icon: Icons.bolt,
    background: Color(0xFFFFE0DD),
    foreground: Color(0xFF9C433B)
  )
};

ExerciseVisualSpec papipoExerciseSpecFor(String slug, {String languageCode = 'en'}) {
  if (languageCode == 'ja') {
    switch (slug) {
      case 'goblet-squat':
        return const ExerciseVisualSpec(
          title: '下半身の強化',
          subtitle: '胸を起こし、お腹を固めて床を押しましょう。',
          coachCue: '肋骨と骨盤を重ね、膝は自然に前へ出します。',
          icon: Icons.fitness_center,
          background: Color(0xFFF7D9B0),
          foreground: Color(0xFF8C4B1F),
        );
      case 'push-up':
        return const ExerciseVisualSpec(
          title: '上半身プッシュ',
          subtitle: '頭からかかとまで長く保ち、床を押しましょう。',
          coachCue: '押す時に息を吐き、首はリラックスさせます。',
          icon: Icons.pan_tool_alt,
          background: Color(0xFFD8E6FF),
          foreground: Color(0xFF244B84),
        );
      case 'dumbbell-row':
        return const ExerciseVisualSpec(
          title: '背中と姿勢',
          subtitle: '肘を肩ではなく後ろポケットへ引くイメージです。',
          coachCue: 'トップで1カウント止めて姿勢を整えます。',
          icon: Icons.north_west,
          background: Color(0xFFDDF4E4),
          foreground: Color(0xFF2E6A49),
        );
      case 'front-plank':
        return const ExerciseVisualSpec(
          title: '体幹の安定',
          subtitle: '時間よりも体幹の張りを大切にします。',
          coachCue: 'お尻を軽く締め、背骨を長く保ちます。',
          icon: Icons.horizontal_rule,
          background: Color(0xFFF6E0F1),
          foreground: Color(0xFF7A3C74),
        );
      case 'worlds-greatest-stretch':
        return const ExerciseVisualSpec(
          title: 'モビリティリセット',
          subtitle: 'ゆっくり呼吸しながら可動域を広げます。',
          coachCue: '急がず、質の高いモビリティワークとして行います。',
          icon: Icons.self_improvement,
          background: Color(0xFFFFE8C9),
          foreground: Color(0xFFA05C16),
        );
      case 'glute-bridge':
        return const ExerciseVisualSpec(
          title: '後鎖の活性化',
          subtitle: '肋骨を静かに保ち、お尻で持ち上げます。',
          coachCue: 'トップで止めて、お尻で支える感覚を作ります。',
          icon: Icons.expand_less,
          background: Color(0xFFDCEAFB),
          foreground: Color(0xFF2D5F91),
        );
      case 'bird-dog':
        return const ExerciseVisualSpec(
          title: 'クロスボディ安定',
          subtitle: '胴体をねじらず長く伸ばします。',
          coachCue: '骨盤を静かに保ち、ゆっくり丁寧に動きます。',
          icon: Icons.gesture,
          background: Color(0xFFE3F3D9),
          foreground: Color(0xFF406D2B),
        );
      case 'dead-bug':
        return const ExerciseVisualSpec(
          title: '深部体幹パターン',
          subtitle: '腰を安定させたまま手足を伸ばします。',
          coachCue: 'お腹の圧が保てる範囲までで十分です。',
          icon: Icons.accessibility_new,
          background: Color(0xFFFCE1D8),
          foreground: Color(0xFF9A4B38),
        );
      case 'brisk-walk':
        return const ExerciseVisualSpec(
          title: '有酸素の土台',
          subtitle: '呼吸が上がるけれど会話はできるペースで。',
          coachCue: '肩を抜き、腕は自然に振りましょう。',
          icon: Icons.directions_walk,
          background: Color(0xFFE7F5EF),
          foreground: Color(0xFF26745A),
        );
      case 'step-up':
        return const ExerciseVisualSpec(
          title: '片脚の強さ',
          subtitle: '足裏全体で押して、上でしっかり伸びます。',
          coachCue: '上がる時も下がる時も丁寧にコントロールします。',
          icon: Icons.stairs,
          background: Color(0xFFFFE6D1),
          foreground: Color(0xFF9B5621),
        );
      case 'bodyweight-squat':
        return const ExerciseVisualSpec(
          title: '動きの質',
          subtitle: '滑らかな反復で股関節と膝を開きます。',
          coachCue: '立ち上がる時も足裏全体で床を押します。',
          icon: Icons.accessibility,
          background: Color(0xFFDDE8FF),
          foreground: Color(0xFF365B98),
        );
      case 'mountain-climber':
        return const ExerciseVisualSpec(
          title: 'コンディショニング',
          subtitle: '手の真上に体を保ち、素早く動きます。',
          coachCue: '腰を上げすぎず、呼吸のリズムを保ちます。',
          icon: Icons.bolt,
          background: Color(0xFFFFE0DD),
          foreground: Color(0xFF9C433B),
        );
      default:
        return const ExerciseVisualSpec(
          title: '全身の動き',
          subtitle: '丁寧にコントロールしながら一定の強度で動きます。',
          coachCue: '可動域を通して滑らかに1回ずつ行いましょう。',
          icon: Icons.sports_gymnastics,
          background: Color(0xFFEDE6DB),
          foreground: Color(0xFF6A5B47),
        );
    }
  }

  return papipoExerciseCatalog[slug] ??
      const ExerciseVisualSpec(
        title: 'General Movement',
        subtitle: 'Move with control and keep the effort steady.',
        coachCue: 'Stay smooth through the full range and own each rep.',
        icon: Icons.sports_gymnastics,
        background: Color(0xFFEDE6DB),
        foreground: Color(0xFF6A5B47),
      );
}
