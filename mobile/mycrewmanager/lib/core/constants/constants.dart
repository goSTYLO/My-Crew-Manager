import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:logger/logger.dart';

class Constants {
  static const List<String> topics = [
    'Technology',
    'Business',
    'Programming',
    'Entertainment',
  ];

  // Loaded from env.json at app startup; fallback keeps app usable if config read fails.
  static String baseUrl = 'http://10.0.2.2:8001/api/';

  static Future<void> loadRuntimeConfig() async {
    try {
      final raw = await rootBundle.loadString('env.json');
      final Map<String, dynamic> config = jsonDecode(raw) as Map<String, dynamic>;
      final apiBase = (config['api_base_url'] as String?)?.trim();
      if (apiBase == null || apiBase.isEmpty) {
        logger.w('env.json missing api_base_url; using fallback: $baseUrl');
        return;
      }

      final normalized = _normalizeApiBaseUrl(apiBase);
      baseUrl = normalized;
      logger.i('Using mobile API base URL: $baseUrl');
    } catch (e) {
      logger.e('Failed to load env.json config, using fallback base URL: $baseUrl');
      logger.e('Config error: $e');
    }
  }

  static String _normalizeApiBaseUrl(String apiBaseUrl) {
    final withScheme = apiBaseUrl.startsWith('http')
        ? apiBaseUrl
        : 'http://$apiBaseUrl';

    final noTrailingSlash = withScheme.endsWith('/')
        ? withScheme.substring(0, withScheme.length - 1)
        : withScheme;

    if (noTrailingSlash.endsWith('/api')) {
      return '$noTrailingSlash/';
    }

    return '$noTrailingSlash/api/';
  }

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
