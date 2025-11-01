import 'package:logger/logger.dart';

class Constants {
  static const List<String> topics = [
    'Technology',
    'Business',
    'Programming',
    'Entertainment',
  ];

  static const baseUrl = "http://192.168.1.10:8000/api/";

  static const noConnectionErrorMessage = 'No internet connection';
}

final logger = Logger();
