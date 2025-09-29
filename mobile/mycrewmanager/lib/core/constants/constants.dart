import 'package:logger/logger.dart';

class Constants {
  static const List<String> topics = [
    'Technology',
    'Business',
    'Programming',
    'Entertainment',
  ];

  static const baseUrl = "http://10.0.2.2:8000/api/";

  static const noConnectionErrorMessage = 'No internet connection';
}

final logger = Logger();
