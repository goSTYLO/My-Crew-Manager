import 'package:flutter/material.dart';

class ChatsPage extends StatefulWidget {
  final String name;
  final String avatarUrl;

  const ChatsPage({
    super.key,
    required this.name,
    required this.avatarUrl,
  });

  static Route<Object?> route({required String name, required String avatarUrl}) =>
      MaterialPageRoute(
        builder: (_) => ChatsPage(name: name, avatarUrl: avatarUrl),
      );

  @override
  State<ChatsPage> createState() => _ChatsPageState();
}

class _ChatsPageState extends State<ChatsPage> {
  final TextEditingController _controller = TextEditingController();

  final List<Map<String, dynamic>> messages = [
    {
      'fromMe': true,
      'text': "Morning Angelie, I have question about My Task",
      'time': "Today 11:52",
      'type': 'text',
    },
    {
      'fromMe': false,
      'text': "Yes sure, Any problem with your assignment?",
      'time': "Today 11:53",
      'type': 'text',
    },
    {
      'fromMe': true,
      'text': "How to make a responsive display from the dashboard?",
      'time': "Today 11:53",
      'type': 'image',
      'image':
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    },
    {
      'fromMe': true,
      'text': "Is there a plugin to do this task?",
      'time': "Today 11:52",
      'type': 'text',
    },
    {
      'fromMe': false,
      'text':
          "No plugins. You just have to make it smaller according to the size of the phone.",
      'time': "Today 11:53",
      'type': 'text',
    },
    {
      'fromMe': false,
      'text':
          "Thank you very much. I'm glad you asked about the assignment",
      'time': "Today 11:53",
      'type': 'text',
    },
  ];

  @override
  Widget build(BuildContext context) {
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
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  itemCount: messages.length,
                  itemBuilder: (context, i) {
                    final msg = messages[i];
                    final isMe = msg['fromMe'] as bool;
                    final isImage = msg['type'] == 'image';
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
                                        msg['image'],
                                        width: 220,
                                        height: 120,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(10),
                                      child: Text(
                                        msg['text'],
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
                                  msg['text'],
                                  style: TextStyle(
                                    color: isMe ? Colors.white : Colors.black87,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 2),
                            Text(
                              msg['time'],
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.black45,
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

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      messages.add({
        'fromMe': true,
        'text': text,
        'time': "Now",
        'type': 'text',
      });
    });
    _controller.clear();
  }
}