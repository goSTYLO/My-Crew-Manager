import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/chat/data/models/room_model.dart';
import 'package:mycrewmanager/features/chat/data/models/message_model.dart';

class ChatRemoteDataSource {
  final Dio dio;

  ChatRemoteDataSource(this.dio);

  Future<List<RoomModel>> listRooms() async {
    final response = await dio.get('chat/rooms/');
    final List<dynamic> data = response.data as List<dynamic>;
    return data.map((e) => RoomModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<MessageModel>> listMessages(int roomId, {int offset = 0, int limit = 50}) async {
    final response = await dio.get('chat/rooms/$roomId/messages/', queryParameters: {
      'offset': offset,
      'limit': limit,
    });
    
    // Handle both old format (plain array) and new format (wrapped response)
    List<dynamic> data;
    if (response.data is Map<String, dynamic>) {
      final responseData = response.data as Map<String, dynamic>;
      // Try 'results' first, fallback to 'messages' for backward compatibility
      data = responseData['results'] ?? responseData['messages'] ?? [];
    } else {
      data = response.data as List<dynamic>;
    }
    
    return data.map((e) => MessageModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<MessageModel> sendMessage({
    required int roomId,
    required String content,
    String messageType = 'text',
    int? replyToId,
  }) async {
    final response = await dio.post('chat/rooms/$roomId/messages/', data: {
      'content': content,
      'message_type': messageType,
      if (replyToId != null) 'reply_to_id': replyToId,
    });
    return MessageModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<RoomModel> createRoom({required String name, bool isPrivate = false}) async {
    final response = await dio.post('chat/rooms/', data: {
      'name': name,
      'is_private': isPrivate,
    });
    return RoomModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<RoomModel> direct({required String email}) async {
    final response = await dio.post('chat/rooms/direct/', data: {
      'email': email,
    });
    return RoomModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> invite({required int roomId, required String email}) async {
    await dio.post('chat/rooms/$roomId/invite/', data: {
      'email': email,
    });
  }

  Future<List<int>> listMembers(int roomId) async {
    final response = await dio.get('chat/rooms/$roomId/members/');
    final List<dynamic> data = response.data as List<dynamic>;
    return data.map((e) => (e as Map<String, dynamic>)['user_id'] as int).toList();
  }
}


