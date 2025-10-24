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

  const InvitationActionSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class InvitationError extends InvitationState {
  final String message;

  const InvitationError(this.message);

  @override
  List<Object?> get props => [message];
}
