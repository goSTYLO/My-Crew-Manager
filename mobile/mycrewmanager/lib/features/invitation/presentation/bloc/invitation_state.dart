import 'package:equatable/equatable.dart';
import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';

abstract class InvitationState extends Equatable {
  const InvitationState();

  @override
  List<Object?> get props => [];
}

class InvitationInitial extends InvitationState {
  const InvitationInitial();
}

class InvitationLoading extends InvitationState {
  const InvitationLoading();
}

class InvitationLoaded extends InvitationState {
  final List<Invitation> invitations;

  const InvitationLoaded(this.invitations);

  @override
  List<Object?> get props => [invitations];
}

class InvitationActionSuccess extends InvitationState {
  final String message;
  final int? invitationId;

  const InvitationActionSuccess(this.message, {this.invitationId});

  @override
  List<Object?> get props => [message, invitationId];
}

class InvitationError extends InvitationState {
  final String message;
  final int? invitationId;

  const InvitationError(this.message, {this.invitationId});

  @override
  List<Object?> get props => [message, invitationId];
}

class InvitationActionInProgress extends InvitationState {
  final int invitationId;
  final bool isAccept;

  const InvitationActionInProgress({required this.invitationId, required this.isAccept});

  @override
  List<Object?> get props => [invitationId, isAccept];
}
