import 'package:fpdart/fpdart.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';

abstract interface class InvitationRepository {
  Future<Either<Failure, List<Invitation>>> getMyInvitations();
  Future<Either<Failure, void>> acceptInvitation(int invitationId);
  Future<Either<Failure, void>> declineInvitation(int invitationId);
}
