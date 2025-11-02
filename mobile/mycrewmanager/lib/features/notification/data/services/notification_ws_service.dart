import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:mycrewmanager/features/notification/data/models/notification_model.dart';
import 'package:mycrewmanager/core/constants/constants.dart';

class NotificationWsService {
  WebSocketChannel? _channel;
  StreamController<NotificationModel>? _notificationController;
  Timer? _reconnectTimer;
  bool _isConnected = false;
  String? _token;

  Stream<NotificationModel> get notificationStream {
    _notificationController ??= StreamController<NotificationModel>.broadcast();
    return _notificationController!.stream;
  }

  bool get isConnected => _isConnected;

  Future<void> connect(String token) async {
    _token = token;
    await _connect();
  }

  Future<void> _connect() async {
    try {
      if (_token == null) {
        throw Exception('No authentication token available');
      }
      
      // Parse the HTTP base URL properly
      final httpUri = Uri.parse(Constants.baseUrl);
      
      // Construct WebSocket URI using Uri builder
      final wsUri = Uri(
        scheme: httpUri.scheme == 'https' ? 'wss' : 'ws',
        host: httpUri.host,
        port: httpUri.port,
        path: '/ws/notifications/',
        queryParameters: {'token': _token!},
      );
      
      _channel = WebSocketChannel.connect(wsUri);
      
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
      );
      
      _isConnected = true;
    } catch (e) {
      _isConnected = false;
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic message) {
    try {
      
      final data = json.decode(message);
      
      if (data['type'] == 'notification' && data['notification'] != null) {
        final notification = NotificationModel.fromJson(data['notification']);
        _notificationController?.add(notification);
      }
    } catch (e) {
      // Silently handle notification processing errors
    }
  }

  void _onError(dynamic error) {
    _isConnected = false;
    _scheduleReconnect();
  }

  void _onDone() {
    _isConnected = false;
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_reconnectTimer?.isActive == true) return;
    
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (_token != null) {
        _connect();
      }
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _notificationController?.close();
    _isConnected = false;
    _token = null;
  }

  void sendMessage(String message) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(message);
    } else {
    }
  }
}
