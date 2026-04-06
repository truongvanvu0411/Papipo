import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'session_controller.dart';

class AppScope extends StatelessWidget {
  const AppScope({
    super.key,
    required this.sessionController,
    required this.child
  });

  final SessionController sessionController;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<SessionController>.value(
      value: sessionController,
      child: child
    );
  }
}
