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
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      final response = await remoteDataSource.getMyInvitations();
      final invitationModels = response['invitations'] as List<dynamic>;
      final invitations = invitationModels.map((json) => InvitationModel.fromJson(json as Map<String, dynamic>)).toList();
      return right(invitations);
    } on DioException catch (e) {
      return left(Failure("Failed to load invitations. Try Again!"));
    }
  }

  @override
  Future<Either<Failure, void>> acceptInvitation(int invitationId) async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.acceptInvitation(invitationId);
      return right(null);
    } on DioException catch (e) {
      
      // Handle timeout errors specifically
      if (e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.connectionTimeout) {
        return left(Failure("Request timed out. The invitation may have been accepted. Please refresh to check the status."));
      }
      
      // Extract specific error message from response
      String errorMessage = "Failed to accept invitation. Try Again!";
      if (e.response?.data != null) {
        try {
          final responseData = e.response!.data;
          if (responseData is Map<String, dynamic> && responseData.containsKey('error')) {
            errorMessage = responseData['error'].toString();
          }
        } catch (parseError) {
        }
      }
      
      return left(Failure(errorMessage));
    }
  }

  @override
  Future<Either<Failure, void>> declineInvitation(int invitationId) async {
    try {
      if (!await connectionChecker.isConnected) {
        return left(Failure(constants.Constants.noConnectionErrorMessage));
      }
      await remoteDataSource.declineInvitation(invitationId);
      return right(null);
    } on DioException catch (e) {
      
      // Handle timeout errors specifically
      if (e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.connectionTimeout) {
        return left(Failure("Request timed out. The invitation may have been declined. Please refresh to check the status."));
      }
      
      // Extract specific error message from response
      String errorMessage = "Failed to decline invitation. Try Again!";
      if (e.response?.data != null) {
        try {
          final responseData = e.response!.data;
          if (responseData is Map<String, dynamic> && responseData.containsKey('error')) {
            errorMessage = responseData['error'].toString();
          }
        } catch (parseError) {
        }
      }
      
      return left(Failure(errorMessage));
    }
  }
}
