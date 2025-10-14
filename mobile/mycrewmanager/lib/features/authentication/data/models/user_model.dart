import 'package:mycrewmanager/features/authentication/domain/entities/user.dart';

class UserModel extends User {

  UserModel({
    required super.id, 
    required super.email, 
    required super.name,
    required super.token
  });

  factory UserModel.fromJson(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] ?? '',
      email: map['email']  ?? '',
      name: map['name']  ?? '',
      token: map['token'] ?? ''
    );
  }

  
  UserModel copyWith({String? id, String? email, String? name, String? token}) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      token: token ?? this.token
    );
  }
}