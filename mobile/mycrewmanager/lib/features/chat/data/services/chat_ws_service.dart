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
    
    if (token == null) {
      throw Exception('No authentication token available');
    }
    
    // Parse the HTTP base URL properly
    final httpUri = Uri.parse(Constants.baseUrl);
    
    // Construct WebSocket URI using Uri builder
    final wsUri = Uri(
      scheme: httpUri.scheme == 'https' ? 'wss' : 'ws',
      host: httpUri.host,
      port: httpUri.port,
      path: '/ws/chat/$roomId/',
      queryParameters: {'token': token},
    );
    

    _controller = StreamController.broadcast();
    
    try {
      _socket = await WebSocket.connect(
        wsUri.toString(),
        headers: {'Authorization': 'Token $token'},
      ).timeout(
        Duration(seconds: 10),
        onTimeout: () {
          throw Exception('WebSocket connection timeout - ensure Daphne is running on 0.0.0.0:8000');
        },
      );
    } catch (e) {
      rethrow;
    }
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
    
    if (token == null) {
      throw Exception('No authentication token available');
    }
    
    // Parse the HTTP base URL properly
    final httpUri = Uri.parse(Constants.baseUrl);
    
    // Construct WebSocket URI using Uri builder
    final wsUri = Uri(
      scheme: httpUri.scheme == 'https' ? 'wss' : 'ws',
      host: httpUri.host,
      port: httpUri.port,
      path: '/ws/chat/notifications/',
      queryParameters: {'token': token},
    );
    
    _controller = StreamController.broadcast();
    
    try {
      _socket = await WebSocket.connect(
        wsUri.toString(),
        headers: {'Authorization': 'Token $token'},
      ).timeout(
        Duration(seconds: 10),
        onTimeout: () {
          throw Exception('WebSocket connection timeout - ensure Daphne is running on 0.0.0.0:8000');
        },
      );
    } catch (e) {
      rethrow;
    }
    
    _socket!.listen((event) {
      try {
        final decoded = json.decode(event as String) as Map<String, dynamic>;
        _controller?.add(decoded);
      } catch (e) {
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


