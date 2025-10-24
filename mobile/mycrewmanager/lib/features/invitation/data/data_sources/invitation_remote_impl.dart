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
  Future<void> acceptInvitation(int invitationId) {
    return _baseDataSource.acceptInvitation(invitationId);
  }

  @override
  Future<void> declineInvitation(int invitationId) {
    return _baseDataSource.declineInvitation(invitationId);
  }
}
