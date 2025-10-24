import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mycrewmanager/features/project/domain/entities/task.dart';

class TaskCacheManager {
  static const String _allTasksKey = 'cached_all_tasks';
  static const String _pendingTasksKey = 'cached_pending_tasks';
  static const String _upcomingTasksKey = 'cached_upcoming_tasks';
  static const String _lastUpdatedKey = 'tasks_last_updated';

  // Save all tasks (for task_widget.dart)
  static Future<void> saveAllTasks(List<ProjectTask> tasks) async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJson = tasks.map((task) => task.toJson()).toList();
    await prefs.setString(_allTasksKey, jsonEncode(tasksJson));
    await prefs.setString(_lastUpdatedKey, DateTime.now().toIso8601String());
  }

  // Load all tasks
  static Future<List<ProjectTask>> loadAllTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJsonString = prefs.getString(_allTasksKey);
    
    if (tasksJsonString == null) return [];
    
    try {
      final List<dynamic> tasksJson = jsonDecode(tasksJsonString);
      return tasksJson.map((json) => ProjectTask.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  // Save pending tasks (for task_carousel_widget.dart)
  static Future<void> savePendingTasks(List<ProjectTask> tasks) async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJson = tasks.map((task) => task.toJson()).toList();
    await prefs.setString(_pendingTasksKey, jsonEncode(tasksJson));
  }

  // Load pending tasks
  static Future<List<ProjectTask>> loadPendingTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJsonString = prefs.getString(_pendingTasksKey);
    
    if (tasksJsonString == null) return [];
    
    try {
      final List<dynamic> tasksJson = jsonDecode(tasksJsonString);
      return tasksJson.map((json) => ProjectTask.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  // Save upcoming tasks (for incomingtask_widget.dart)
  static Future<void> saveUpcomingTasks(List<ProjectTask> tasks) async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJson = tasks.map((task) => task.toJson()).toList();
    await prefs.setString(_upcomingTasksKey, jsonEncode(tasksJson));
  }

  // Load upcoming tasks
  static Future<List<ProjectTask>> loadUpcomingTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJsonString = prefs.getString(_upcomingTasksKey);
    
    if (tasksJsonString == null) return [];
    
    try {
      final List<dynamic> tasksJson = jsonDecode(tasksJsonString);
      return tasksJson.map((json) => ProjectTask.fromJson(json)).toList();
    } catch (e) {
      return [];
    }
  }

  // Get last updated timestamp
  static Future<DateTime?> getLastUpdated() async {
    final prefs = await SharedPreferences.getInstance();
    final lastUpdatedString = prefs.getString(_lastUpdatedKey);
    
    if (lastUpdatedString == null) return null;
    
    try {
      return DateTime.parse(lastUpdatedString);
    } catch (e) {
      return null;
    }
  }

  // Clear all cached data
  static Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_allTasksKey);
    await prefs.remove(_pendingTasksKey);
    await prefs.remove(_upcomingTasksKey);
    await prefs.remove(_lastUpdatedKey);
  }

  // Check if cache exists
  static Future<bool> hasCachedData() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_allTasksKey) || 
           prefs.containsKey(_pendingTasksKey) || 
           prefs.containsKey(_upcomingTasksKey);
  }
}
