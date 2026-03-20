import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/invitation/domain/entities/invitation.dart';
import 'package:mycrewmanager/features/invitation/domain/repository/invitation_repository.dart';

class SentInvitationsPage extends StatefulWidget {
  const SentInvitationsPage({super.key});

  static Route<Object?> route() {
    return MaterialPageRoute(builder: (_) => const SentInvitationsPage());
  }

  @override
  State<SentInvitationsPage> createState() => _SentInvitationsPageState();
}

class _SentInvitationsPageState extends State<SentInvitationsPage> {
  final _repo = GetIt.I<InvitationRepository>();
  bool _loading = true;
  String? _error;
  List<Invitation> _invitations = [];

  @override
  void initState() {
    super.initState();
    _loadSentInvitations();
  }

  Future<void> _loadSentInvitations() async {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthSuccess) {
      setState(() {
        _loading = false;
        _error = 'Please log in again to load invitations.';
      });
      return;
    }

    final currentUserId = int.tryParse(authState.user.id);
    if (currentUserId == null) {
      setState(() {
        _loading = false;
        _error = 'Invalid account id. Please log in again.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await _repo.getSentInvitations(currentUserId);

    if (!mounted) return;

    result.fold(
      (failure) {
        setState(() {
          _loading = false;
          _error = failure.message;
          _invitations = [];
        });
      },
      (invitations) {
        setState(() {
          _loading = false;
          _error = null;
          _invitations = invitations;
        });
      },
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
        return Colors.green;
      case 'declined':
        return Colors.red;
      case 'pending':
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Sent Invitations',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadSentInvitations,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _invitations.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _loadSentInvitations,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 180),
                          Center(
                            child: Text(
                              'No invitations sent yet',
                              style: TextStyle(color: Colors.grey, fontSize: 16),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadSentInvitations,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _invitations.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final invitation = _invitations[index];
                          final statusColor = _statusColor(invitation.status);
                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.black12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        invitation.projectTitle,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        invitation.status.toUpperCase(),
                                        style: TextStyle(
                                          color: statusColor,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Invitee: ${invitation.inviteeName ?? invitation.inviteeEmail ?? 'Unknown'}',
                                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Role: ${invitation.role}',
                                  style: const TextStyle(fontSize: 13, color: Colors.black54),
                                ),
                                if (invitation.message != null && invitation.message!.trim().isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    invitation.message!,
                                    style: const TextStyle(fontSize: 13, color: Colors.black54),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
