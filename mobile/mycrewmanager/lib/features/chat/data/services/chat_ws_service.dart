import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/tokenhandlers/token_storage.dart';

class ChatWsService {
  final TokenStorage tokenStorage;
  WebSocket? _socket;
  StreamController<dynamic>? _controller;

  ChatWsService(this.tokenStorage);

  Future<Stream<dynamic>> connectToRoom(int roomId) async {
    await disconnect();
    final token = await tokenStorage.getToken();
    // Convert http://10.0.2.2:8000/api/ => ws://10.0.2.2:8000/ws/chat/{roomId}/?token=...
    final httpBase = Constants.baseUrl; // ends with /api/
    final origin = httpBase.replaceAll('/api/', '');
    final wsBase = origin.replaceFirst('http', 'ws');
    final uri = Uri.parse('${wsBase}ws/chat/$roomId/?token=$token');

    _controller = StreamController.broadcast();
    _socket = await WebSocket.connect(uri.toString());
    _socket!.listen((event) {
      try {
        final decoded = json.decode(event as String) as Map<String, dynamic>;
        _controller?.add(decoded);
      } catch (_) {
        _controller?.add(event);
      }
    }, onDone: () {
      _controller?.close();
    }, onError: (e) {
      _controller?.addError(e);
    });

    return _controller!.stream;
  }

  Future<Stream<dynamic>> connectToNotifications() async {
    await disconnect();
    final token = await tokenStorage.getToken();
    final httpBase = Constants.baseUrl; // ends with /api/
    final origin = httpBase.replaceAll('/api/', '');
    final wsBase = origin.replaceFirst('http', 'ws');
    final uri = Uri.parse('${wsBase}ws/chat/notifications/?token=$token');

    _controller = StreamController.broadcast();
    _socket = await WebSocket.connect(uri.toString());
    _socket!.listen((event) {
      try {
        final decoded = json.decode(event as String) as Map<String, dynamic>;
        _controller?.add(decoded);
      } catch (_) {
        _controller?.add(event);
      }
    }, onDone: () {
      _controller?.close();
    }, onError: (e) {
      _controller?.addError(e);
    });

    return _controller!.stream;
  }

  Future<void> sendTyping() async {
    final data = json.encode({'type': 'typing'});
    _socket?.add(data);
  }

  Future<void> sendStopTyping() async {
    final data = json.encode({'type': 'stop_typing'});
    _socket?.add(data);
  }

  Future<void> disconnect() async {
    try {
      await _socket?.close();
    } catch (_) {}
    _socket = null;
    await _controller?.close();
    _controller = null;
  }
}


