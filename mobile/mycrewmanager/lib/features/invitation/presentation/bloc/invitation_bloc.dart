import 'package:flutter_bloc/flutter_bloc.dart';
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
    emit(const InvitationLoading());

    final result = await _invitationRepository.getMyInvitations();

    result.fold(
      (failure) {
        emit(InvitationError(failure.message));
      },
      (invitations) {
        emit(InvitationLoaded(invitations));
      },
    );
  }

  void _onAcceptInvitation(AcceptInvitation event, Emitter<InvitationState> emit) async {
    emit(InvitationActionInProgress(invitationId: event.invitationId, isAccept: true));

    final result = await _invitationRepository.acceptInvitation(event.invitationId);

    result.fold(
      (failure) {
        emit(InvitationError(failure.message, invitationId: event.invitationId));
      },
      (_) {
        emit(InvitationActionSuccess("Invitation accepted successfully!", invitationId: event.invitationId));
        // Reload invitations to update the UI
        add(const LoadInvitations());
      },
    );
  }

  void _onDeclineInvitation(DeclineInvitation event, Emitter<InvitationState> emit) async {
    emit(InvitationActionInProgress(invitationId: event.invitationId, isAccept: false));

    final result = await _invitationRepository.declineInvitation(event.invitationId);

    result.fold(
      (failure) {
        emit(InvitationError(failure.message, invitationId: event.invitationId));
      },
      (_) {
        emit(InvitationActionSuccess("Invitation declined successfully!", invitationId: event.invitationId));
        // Reload invitations to update the UI
        add(const LoadInvitations());
      },
    );
  }
}
