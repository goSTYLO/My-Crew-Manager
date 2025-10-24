import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'invitation_remote.g.dart';

@RestApi(baseUrl: "ai/invitations/")
abstract class InvitationRemoteDataSource {
  factory InvitationRemoteDataSource(Dio dio) = _InvitationRemoteDataSource;

  @POST("{id}/accept/")
  Future<void> acceptInvitation(@Path("id") int invitationId);

  @POST("{id}/decline/")
  Future<void> declineInvitation(@Path("id") int invitationId);
}
