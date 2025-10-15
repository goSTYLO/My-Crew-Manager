import 'package:mycrewmanager/features/chat/data/data_sources/chat_remote.dart';
import 'package:mycrewmanager/features/chat/data/models/message_model.dart';
import 'package:mycrewmanager/features/chat/data/models/room_model.dart';

class ChatRepositoryImpl {
  final ChatRemoteDataSource remote;

  ChatRepositoryImpl(this.remote);

  Future<List<RoomModel>> listRooms() => remote.listRooms();
  Future<List<MessageModel>> listMessages(int roomId) => remote.listMessages(roomId);
  Future<MessageModel> sendMessage(int roomId, String content, {String messageType = 'text', int? replyToId}) =>
      remote.sendMessage(roomId: roomId, content: content, messageType: messageType, replyToId: replyToId);

  Future<RoomModel> createRoom(String name, {bool isPrivate = false}) => remote.createRoom(name: name, isPrivate: isPrivate);
  Future<RoomModel> direct(String email) => remote.direct(email: email);
  Future<void> invite(int roomId, String email) => remote.invite(roomId: roomId, email: email);
  Future<List<int>> listMembers(int roomId) => remote.listMembers(roomId);
}


