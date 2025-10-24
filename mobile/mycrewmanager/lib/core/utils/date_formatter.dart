import 'package:intl/intl.dart';

class DateFormatter {
  /// Formats a date string to show "Today", "Yesterday", or "MM/DD/YYYY"
  /// 
  /// [dateString] - ISO 8601 date string (e.g., "2025-10-24T13:15:02.648201Z")
  /// Returns formatted date string
  static String formatChatDate(String dateString) {
    try {
      // Parse the ISO 8601 date string
      final DateTime date = DateTime.parse(dateString);
      final DateTime now = DateTime.now();
      final DateTime today = DateTime(now.year, now.month, now.day);
      final DateTime yesterday = today.subtract(const Duration(days: 1));
      final DateTime messageDate = DateTime(date.year, date.month, date.day);

      if (messageDate == today) {
        return 'Today';
      } else if (messageDate == yesterday) {
        return 'Yesterday';
      } else {
        // Format as MM/DD/YYYY
        return DateFormat('MM/dd/yyyy').format(date);
      }
    } catch (e) {
      // If parsing fails, return the original string
      return dateString;
    }
  }

  /// Formats a date string to show time only (HH:MM AM/PM)
  /// 
  /// [dateString] - ISO 8601 date string
  /// Returns formatted time string
  static String formatChatTime(String dateString) {
    try {
      final DateTime date = DateTime.parse(dateString);
      return DateFormat('h:mm a').format(date);
    } catch (e) {
      return dateString;
    }
  }

  /// Formats a date string to show both date and time
  /// 
  /// [dateString] - ISO 8601 date string
  /// Returns formatted date and time string
  static String formatChatDateTime(String dateString) {
    try {
      final DateTime date = DateTime.parse(dateString);
      final DateTime now = DateTime.now();
      final DateTime today = DateTime(now.year, now.month, now.day);
      final DateTime yesterday = today.subtract(const Duration(days: 1));
      final DateTime messageDate = DateTime(date.year, date.month, date.day);

      final String timeString = DateFormat('h:mm a').format(date);

      if (messageDate == today) {
        return 'Today $timeString';
      } else if (messageDate == yesterday) {
        return 'Yesterday $timeString';
      } else {
        final String dateString = DateFormat('MM/dd/yyyy').format(date);
        return '$dateString $timeString';
      }
    } catch (e) {
      return dateString;
    }
  }
}
