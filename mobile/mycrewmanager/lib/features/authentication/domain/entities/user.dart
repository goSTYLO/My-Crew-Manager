class User {
  final String id;
  final String email;
  final String name;
  final String token;
  final String? role;
  final String? profilePicture;

  User({required this.id, required this.email, required this.name, required this.token, this.role, this.profilePicture});

  User copyWith({String? id, String? email, String? name, String? token, String? role, String? profilePicture}) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      token: token ?? this.token,
      role: role ?? this.role,
      profilePicture: profilePicture ?? this.profilePicture,
    );
  }
}
