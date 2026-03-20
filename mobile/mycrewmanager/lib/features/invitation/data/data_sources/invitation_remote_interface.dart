abstract class InvitationRemoteDataSourceInterface {
  Future<Map<String, dynamic>> getMyInvitations();
  Future<List<dynamic>> getSentInvitations();
  Future<void> acceptInvitation(int invitationId);
  Future<void> declineInvitation(int invitationId);
}
