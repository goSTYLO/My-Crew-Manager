class RoleFormatter {
  /// Formats role names from database format to display format
  /// 
  /// Examples:
  /// - 'developer' -> 'Developer'
  /// - 'project_manager' -> 'Project Manager'
  /// - 'admin' -> 'Admin'
  /// - 'user' -> 'User'
  static String formatRole(String? role) {
    if (role == null || role.isEmpty) {
      return 'User';
    }

    // Handle specific role mappings
    switch (role.toLowerCase()) {
      case 'developer':
        return 'Developer';
      case 'project_manager':
        return 'Project Manager';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        // For any other roles, capitalize first letter of each word
        return role
            .split('_')
            .map((word) => word.isNotEmpty 
                ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
                : '')
            .join(' ');
    }
  }

  /// Gets the role for comparison purposes (keeps original format)
  /// This is useful for role-based logic where we need the original database value
  static String getRoleForComparison(String? role) {
    return role?.toLowerCase() ?? 'user';
  }
}
