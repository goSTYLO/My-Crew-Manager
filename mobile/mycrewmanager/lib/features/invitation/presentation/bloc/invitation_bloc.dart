import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/features/invitation/domain/repository/invitation_repository.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_event.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_state.dart';

class InvitationBloc extends Bloc<InvitationEvent, InvitationState> {
  final InvitationRepository _invitationRepository;

  InvitationBloc({
    required InvitationRepository invitationRepository,
  })  : _invitationRepository = invitationRepository,
        super(const InvitationInitial()) {
    on<LoadInvitations>(_onLoadInvitations);
    on<AcceptInvitation>(_onAcceptInvitation);
    on<DeclineInvitation>(_onDeclineInvitation);
  }

  void _onLoadInvitations(LoadInvitations event, Emitter<InvitationState> emit) async {
    logger.d("📱 Loading invitations...");
    emit(const InvitationLoading());

    final result = await _invitationRepository.getMyInvitations();

    result.fold(
      (failure) {
        logger.d("❌ Failed to load invitations: ${failure.message}");
        emit(InvitationError(failure.message));
      },
      (invitations) {
        logger.d("✅ Loaded ${invitations.length} invitations");
        emit(InvitationLoaded(invitations));
      },
    );
  }

  void _onAcceptInvitation(AcceptInvitation event, Emitter<InvitationState> emit) async {
    logger.d("📱 Accepting invitation: ${event.invitationId}");

    final result = await _invitationRepository.acceptInvitation(event.invitationId);

    result.fold(
      (failure) {
        logger.d("❌ Failed to accept invitation: ${failure.message}");
        emit(InvitationError(failure.message));
      },
      (_) {
        logger.d("✅ Invitation accepted successfully");
        emit(const InvitationActionSuccess("Invitation accepted successfully!"));
        // Reload invitations to update the UI
        add(const LoadInvitations());
      },
    );
  }

  void _onDeclineInvitation(DeclineInvitation event, Emitter<InvitationState> emit) async {
    logger.d("📱 Declining invitation: ${event.invitationId}");

    final result = await _invitationRepository.declineInvitation(event.invitationId);

    result.fold(
      (failure) {
        logger.d("❌ Failed to decline invitation: ${failure.message}");
        emit(InvitationError(failure.message));
      },
      (_) {
        logger.d("✅ Invitation declined successfully");
        emit(const InvitationActionSuccess("Invitation declined successfully!"));
        // Reload invitations to update the UI
        add(const LoadInvitations());
      },
    );
  }
}
