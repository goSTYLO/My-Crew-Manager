import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/chat/data/models/message_model.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/core/utils/date_formatter.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';

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
  final ScrollController _scrollController = ScrollController();
  final _repo = GetIt.I<ChatRepositoryImpl>();
  final _ws = GetIt.I<ChatWsService>();
  final List<MessageModel> _messages = [];
  // Stream is listened immediately; no need to store
  bool _loading = true;
  bool _sending = false;
  StreamSubscription<dynamic>? _wsSubscription;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _connectWs();
  }

  void _scrollToBottom({bool animated = true}) {
    if (_scrollController.hasClients) {
      if (animated) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      } else {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    }
  }

  Future<void> _loadMessages({int offset = 0, int limit = 100}) async {
    final roomId = widget.roomId;
    try {
      final msgs = await _repo.listMessages(roomId, offset: offset, limit: limit);
      setState(() {
        if (offset == 0) {
          // First load - replace all messages
          _messages
            ..clear()
            ..addAll(msgs);
        } else {
          // Pagination load - add to existing messages
          _messages.addAll(msgs);
        }
      });
      
      // Scroll to bottom after loading messages
      if (offset == 0) {
        // For initial load, scroll immediately without animation
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom(animated: false);
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _connectWs() async {
    try {
      final stream = await _ws.connectToRoom(widget.roomId);
      
      _wsSubscription = stream.listen(
        (event) {
          
          if (!mounted) {
            return;
          }
          
          if (event is Map<String, dynamic>) {
            final type = event['type'] as String?;
            
            if (type == 'chat_message') {
              try {
                final msg = MessageModel.fromJson(event['message'] as Map<String, dynamic>);
                
                setState(() {
                  // Get current user ID for filtering
                  String? currentUserId;
                  final authState = context.read<AuthBloc>().state;
                  if (authState is AuthSuccess) {
                    currentUserId = authState.user.id;
                  }
                  
                  // Find and remove any pending optimistic message from CURRENT USER only
                  final now = DateTime.now();
                  final removedCount = _messages.length;
                  _messages.removeWhere((m) => 
                    m.isPending && 
                    m.content == msg.content &&
                    m.senderId.toString() == currentUserId && // Only remove OUR optimistic messages
                    now.difference(DateTime.parse(m.createdAt)).inSeconds < 10
                  );
                  
                  if (removedCount != _messages.length) {
                  }
                  
                  // Check if message already exists (by message_id)
                  final messageExists = _messages.any((m) => m.messageId == msg.messageId && msg.messageId > 0);
                  
                  if (!messageExists) {
                    _messages.add(msg);
                    // Scroll to bottom when new message is added
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _scrollToBottom();
                    });
                  } else {
                  }
                });
              } catch (e) {
              }
            }
          } else {
          }
        },
        onError: (error) {
        },
        onDone: () {
        },
      );
    } catch (e) {
    }
  }

  @override
  void didUpdateWidget(ChatsPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.roomId != widget.roomId) {
      _wsSubscription?.cancel();
      _loadMessages();
      _connectWs();
    }
  }

  @override
  void dispose() {
    _wsSubscription?.cancel();
    _ws.disconnect();
    _controller.dispose();
    _scrollController.dispose();
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
                      icon: const Icon(Icons.person_add_alt_1, color: Colors.black87),
                      onPressed: _showInviteDialog,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // Chat messages
              Expanded(
                child: _loading
                    ? ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        itemCount: 5,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, __) => const ChatMessageSkeleton(),
                      )
                    : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  itemCount: _messages.length,
                  itemBuilder: (context, i) {
                    final msg = _messages[i];
                    final isMe = currentUserId != null && msg.senderId.toString() == currentUserId;
                    final isImage = msg.messageType == 'image';
                    
                    // Check if we need to show a date separator
                    final bool showDateSeparator = i == 0 || 
                        DateFormatter.formatChatDate(_messages[i-1].createdAt) != 
                        DateFormatter.formatChatDate(msg.createdAt);
                    
                    return Column(
                      children: [
                        // Date separator
                        if (showDateSeparator)
                          Container(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              DateFormatter.formatChatDate(msg.createdAt),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                            ),
                          ),
                        // Message
                        Align(
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
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      '${msg.senderUsername} • ${DateFormatter.formatChatDate(msg.createdAt)}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.black54,
                                      ),
                                    ),
                                    if (msg.isPending)
                                      Padding(
                                        padding: const EdgeInsets.only(left: 4),
                                        child: Icon(
                                          Icons.schedule,
                                          size: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
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
                        color: _sending ? Colors.grey : Colors.blue,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: IconButton(
                        icon: _sending 
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.send, color: Colors.white),
                        onPressed: _sending ? null : _sendMessage,
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
    if (text.isEmpty || _sending) return;
    
    setState(() => _sending = true);
    
    // Generate temporary ID
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    
    // Get current user info
    String? currentUserId;
    String? currentUserName;
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthSuccess) {
      currentUserId = authState.user.id;
      currentUserName = authState.user.name;
    }
    
    // Add optimistic message immediately
    final optimisticMessage = MessageModel.optimistic(
      tempId: tempId,
      roomId: widget.roomId,
      senderId: int.parse(currentUserId ?? '0'),
      senderUsername: currentUserName ?? 'You',
      content: text,
    );
    
    setState(() {
      _messages.add(optimisticMessage);
    });
    
    // Scroll to bottom when adding optimistic message
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom();
    });
    
    _controller.clear();
    
    try {
      // Send to server (no await for UI responsiveness)
      _repo.sendMessage(widget.roomId, text).then((sentMessage) {
        // Server returned the message, but we'll let WebSocket handle the replacement
        // to ensure all clients get the same confirmed message
      }).catchError((e) {
        // If sending fails, mark the optimistic message as failed
        if (mounted) {
          setState(() {
            final index = _messages.indexWhere((m) => m.tempId == tempId);
            if (index != -1) {
              // Could add a 'failed' state to the model, or remove it
              _messages.removeAt(index);
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to send message: ${e.toString()}'))
          );
        }
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _showInviteDialog() async {
    final controller = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                const Text(
                  'Invite User',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF181929),
                  ),
                ),
                const SizedBox(height: 20),
                // Input field
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFE8ECF4),
                      width: 1,
                    ),
                  ),
                  child: TextField(
                    controller: controller,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'User email',
                      hintStyle: TextStyle(
                        color: Color(0xFF7B7F9E),
                        fontSize: 16,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            color: Color(0xFF6C63FF),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6C63FF),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Invite',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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