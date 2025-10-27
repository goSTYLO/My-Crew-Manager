import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/features/notification/data/models/notification_model.dart';

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
      
      final uri = Uri.parse('ws://localhost:8000/ws/notifications/');
      _channel = WebSocketChannel.connect(uri);
      
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
      );
      
      _isConnected = true;
    } catch (e) {
      logger.d("❌ Failed to connect to notification WebSocket: $e");
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
      logger.d("❌ Error processing notification message: $e");
    }
  }

  void _onError(dynamic error) {
    logger.d("❌ Notification WebSocket error: $error");
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
