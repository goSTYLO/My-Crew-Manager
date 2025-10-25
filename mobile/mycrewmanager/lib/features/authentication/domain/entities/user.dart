class User {
  final String id;
  final String email;
  final String name;
  final String token;
  final String? role;

  User({required this.id, required this.email, required this.name, required this.token, this.role});
}
