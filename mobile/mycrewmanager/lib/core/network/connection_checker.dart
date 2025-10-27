import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

abstract interface class ConnectionChecker {
  Future<bool> get isConnected;
}

class ConnectionCheckerImpl implements ConnectionChecker {
  final InternetConnection internetConnection;
  final listener =
      InternetConnection().onStatusChange.listen((InternetStatus status) {
    switch (status) {
      case InternetStatus.connected:
        break;
      case InternetStatus.disconnected:
        break;
    }
  });

  ConnectionCheckerImpl(this.internetConnection);

  @override
  Future<bool> get isConnected async =>
      await internetConnection.hasInternetAccess;
}
