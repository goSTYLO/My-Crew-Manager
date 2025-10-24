import 'package:fpdart/fpdart.dart';
import 'package:dio/dio.dart';
import 'package:mycrewmanager/core/error/failures/failures.dart';
import 'package:mycrewmanager/core/network/connection_checker.dart';
import 'package:mycrewmanager/core/constants/constants.dart' as constants;
import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';
import 'package:mycrewmanager/features/invitation/domain/repository/invitation_repository.dart';
import 'package:mycrewmanager/features/invitation/data/data_sources/invitation_remote_interface.dart';
import 'package:mycrewmanager/features/invitation/data/models/invitation_model.dart';
import 'package:mycrewmanager/init_dependencies.dart';

class InvitationRepositoryImpl implements InvitationRepository {
  final InvitationRemoteDataSourceInterface remoteDataSource;
  final ConnectionChecker connectionChecker;

  InvitationRepositoryImpl(this.remoteDataSource, this.connectionChecker);

  @override
  Future<Either<Failure, List<Invitation>>> getMyInvitations() async {
    logger.d("🌐 Making API call to get my invitations");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making get my invitations API call...");
      final response = await remoteDataSource.getMyInvitations();
      final invitationModels = response['invitations'] as List<dynamic>;
      final invitations = invitationModels.map((json) => InvitationModel.fromJson(json as Map<String, dynamic>)).toList();
      logger.d("✅ Get my invitations API call successful");
      return right(invitations);
    } on DioException catch (e) {
      logger.d("❌ Get my invitations DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to load invitations. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> acceptInvitation(int invitationId) async {
    logger.d("🌐 Making API call to accept invitation: $invitationId");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making accept invitation API call...");
      await remoteDataSource.acceptInvitation(invitationId);
      logger.d("✅ Accept invitation API call successful");
      return right(null);
    } on DioException catch (e) {
      logger.d("❌ Accept invitation DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to accept invitation. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> declineInvitation(int invitationId) async {
    logger.d("🌐 Making API call to decline invitation: $invitationId");
    try {
      if (!await connectionChecker.isConnected) {
        logger.d("❌ No internet connection");
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      logger.d("✅ Internet connection available, making decline invitation API call...");
      await remoteDataSource.declineInvitation(invitationId);
      logger.d("✅ Decline invitation API call successful");
      return right(null);
    } on DioException catch (e) {
      logger.d("❌ Decline invitation DioException: ${e.message} - Status: ${e.response?.statusCode}");
      return left(Failure("Failed to decline invitation. Try Again!"));
    }
  }
}
