import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

class Constants {
  static const List<String> topics = [
    'Technology',
    'Business',
    'Programming',
    'Entertainment',
  ];

  // Base URL for API requests
  // For Android Emulator: use "http://10.0.2.2:8000/api/" (default)
  // For Physical Device or if 10.0.2.2 fails: use "http://192.168.100.117:8000/api/" (your Windows IP)
  // To find your Windows IP: ipconfig | findstr /i "IPv4"
  // See mobile/docs/ALTERNATIVE_CONNECTION_METHOD.md for details
  static const baseUrl = "http://10.0.2.2:8000/api/";

  static const noConnectionErrorMessage = 'No internet connection';
}

// Configure logger to output to both VS Code Debug Console and logcat (via debugPrint)
final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0, // Don't print stack trace method count
    errorMethodCount: 5, // Print stack trace for errors
    lineLength: 120,
    colors: true,
    printEmojis: true,
  ),
  output: _MultiOutput([
    ConsoleOutput(), // VS Code Debug Console
    _DebugPrintOutput(), // Android logcat via debugPrint
  ]),
  level: Level.debug,
);

// Custom output that uses debugPrint to send logs to logcat
class _DebugPrintOutput extends LogOutput {
  @override
  void output(OutputEvent event) {
    for (var line in event.lines) {
      debugPrint(line); // This will appear in logcat
    }
  }
}

// Output that combines multiple outputs
class _MultiOutput extends LogOutput {
  final List<LogOutput> outputs;

  _MultiOutput(this.outputs);

  @override
  void output(OutputEvent event) {
    for (var output in outputs) {
      output.output(event);
    }
  }
}
