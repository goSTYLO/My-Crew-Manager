import 'package:dio/dio.dart';
import 'package:mycrewmanager/features/invitation/data/data_sources/invitation_remote.dart';
import 'package:mycrewmanager/features/invitation/data/data_sources/invitation_remote_interface.dart';

class InvitationRemoteDataSourceImpl implements InvitationRemoteDataSourceInterface {
  final Dio _dio;
  final InvitationRemoteDataSource _baseDataSource;

  InvitationRemoteDataSourceImpl(this._dio) : _baseDataSource = InvitationRemoteDataSource(_dio);

  @override
  Future<Map<String, dynamic>> getMyInvitations() async {
    final response = await _dio.get('ai/invitations/my-invitations/');
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<void> acceptInvitation(int invitationId) async {
    // Increase timeout for invitation acceptance as it involves complex database operations
    final originalReceiveTimeout = _dio.options.receiveTimeout;
    final originalConnectTimeout = _dio.options.connectTimeout;
    
    try {
      _dio.options = _dio.options.copyWith(
        receiveTimeout: const Duration(seconds: 30),
        connectTimeout: const Duration(seconds: 15),
      );
      
      return await _baseDataSource.acceptInvitation(invitationId);
    } finally {
      // Restore original timeouts
      _dio.options = _dio.options.copyWith(
        receiveTimeout: originalReceiveTimeout,
        connectTimeout: originalConnectTimeout,
      );
    }
  }

  @override
  Future<void> declineInvitation(int invitationId) async {
    // Increase timeout for invitation decline as it involves database operations
    final originalReceiveTimeout = _dio.options.receiveTimeout;
    final originalConnectTimeout = _dio.options.connectTimeout;
    
    try {
      _dio.options = _dio.options.copyWith(
        receiveTimeout: const Duration(seconds: 30),
        connectTimeout: const Duration(seconds: 15),
      );
      
      return await _baseDataSource.declineInvitation(invitationId);
    } finally {
      // Restore original timeouts
      _dio.options = _dio.options.copyWith(
        receiveTimeout: originalReceiveTimeout,
        connectTimeout: originalConnectTimeout,
      );
    }
  }
}
