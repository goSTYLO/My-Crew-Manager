import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/chat/data/models/message_model.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';

class ChatsPage extends StatefulWidget {
  final String name;
  final String avatarUrl;
  final int roomId;

  const ChatsPage({
    super.key,
    required this.name,
    required this.avatarUrl,
    required this.roomId,
  });

  static Route<Object?> route({required String name, required String avatarUrl, required int roomId}) =>
      MaterialPageRoute(
        builder: (_) => ChatsPage(name: name, avatarUrl: avatarUrl, roomId: roomId),
      );

  @override
  State<ChatsPage> createState() => _ChatsPageState();
}

class _ChatsPageState extends State<ChatsPage> {
  final TextEditingController _controller = TextEditingController();
  final _repo = GetIt.I<ChatRepositoryImpl>();
  final _ws = GetIt.I<ChatWsService>();
  final List<MessageModel> _messages = [];
  // Stream is listened immediately; no need to store
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _connectWs();
  }

  Future<void> _loadMessages() async {
    final roomId = widget.roomId;
    try {
      final msgs = await _repo.listMessages(roomId);
      setState(() {
        _messages
          ..clear()
          ..addAll(msgs);
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _connectWs() async {
    final stream = await _ws.connectToRoom(widget.roomId);
    stream.listen((event) {
      if (event is Map<String, dynamic>) {
        final type = event['type'] as String?;
        if (type == 'chat_message') {
          final msg = MessageModel.fromJson(event['message'] as Map<String, dynamic>);
          setState(() {
            _messages.add(msg);
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _ws.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Determine current user id from auth state to align bubbles
    String? currentUserId;
    final authState = context.watch<AuthBloc>().state;
    if (authState is AuthSuccess) {
      currentUserId = authState.user.id;
    }
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.only(top: 8, left: 8, right: 8, bottom: 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                      onPressed: () => Navigator.pop(context),
                    ),
                    CircleAvatar(
                      radius: 18,
                      backgroundImage: NetworkImage(widget.avatarUrl),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: Colors.black,
                            ),
                          ),
                          const Row(
                            children: [
                              Icon(Icons.circle, color: Colors.green, size: 10),
                              SizedBox(width: 4),
                              Text(
                                "Online",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.videocam_outlined, color: Colors.black54),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.call_outlined, color: Colors.black54),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.person_add_alt_1, color: Colors.black87),
                      onPressed: _showInviteDialog,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // "Today" label
              Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  "Today",
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
              // Chat messages
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  itemCount: _messages.length,
                  itemBuilder: (context, i) {
                    final msg = _messages[i];
                    final isMe = currentUserId != null && msg.senderId.toString() == currentUserId;
                    final isImage = msg.messageType == 'image';
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Column(
                          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                          children: [
                            if (isImage)
                              Container(
                                constraints: const BoxConstraints(maxWidth: 220),
                                decoration: BoxDecoration(
                                  color: isMe ? const Color(0xFF2563EB) : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ClipRRect(
                                      borderRadius: const BorderRadius.only(
                                        topLeft: Radius.circular(14),
                                        topRight: Radius.circular(14),
                                      ),
                                      child: Image.network(
                                        '',
                                        width: 220,
                                        height: 120,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(10),
                                      child: Text(
                                        msg.content,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w500,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else
                              Container(
                                constraints: const BoxConstraints(maxWidth: 220),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isMe ? const Color(0xFF2563EB) : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: isMe
                                      ? null
                                      : Border.all(color: Colors.black12),
                                ),
                                child: Text(
                                  msg.content,
                                  style: TextStyle(
                                    color: isMe ? Colors.white : Colors.black87,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 4),
                            Text(
                              '${msg.senderUsername} • ${msg.createdAt}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Input bar
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 18),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: InputDecoration(
                          hintText: "Send your message...",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: Color(0xFFE8ECF4)),
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 0),
                        ),
                        onSubmitted: (val) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.send, color: Colors.white),
                        onPressed: _sendMessage,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final sent = await _repo.sendMessage(widget.roomId, text);
    setState(() {
      _messages.add(sent);
    });
    _controller.clear();
  }

  Future<void> _showInviteDialog() async {
    final controller = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Invite User'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'User email'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Invite')),
        ],
      ),
    );
    if (created == true) {
      final email = controller.text.trim();
      if (email.isEmpty) return;
      try {
        await _repo.invite(widget.roomId, email);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invitation sent')));
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to invite')));
        }
      }
    }
  }
}