import 'package:equatable/equatable.dart';

abstract class InvitationEvent extends Equatable {
  const InvitationEvent();

  @override
  List<Object?> get props => [];
}

class LoadInvitations extends InvitationEvent {
  const LoadInvitations();
}

class AcceptInvitation extends InvitationEvent {
  final int invitationId;

  const AcceptInvitation(this.invitationId);

  @override
  List<Object?> get props => [invitationId];
}

class DeclineInvitation extends InvitationEvent {
  final int invitationId;

  const DeclineInvitation(this.invitationId);

  @override
  List<Object?> get props => [invitationId];
}
