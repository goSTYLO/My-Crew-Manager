import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_bloc.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_event.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_state.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_bloc.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_event.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_state.dart';
import 'package:mycrewmanager/features/notification/domain/entities/notification.dart' as notification_entity;

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const NotificationsPage());

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    // Load notifications and invitations when the page opens
    context.read<NotificationBloc>().add(const LoadNotifications());
    context.read<InvitationBloc>().add(const LoadInvitations());
  }

  void _clearAll() {
    context.read<NotificationBloc>().add(const MarkAllAsRead());
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'project_invitation':
        return Icons.group_add_rounded;
      case 'task_assigned':
        return Icons.assignment_turned_in_rounded;
      case 'task_updated':
        return Icons.edit_rounded;
      case 'task_completed':
        return Icons.check_circle_rounded;
      case 'mention':
        return Icons.chat_rounded;
      case 'deadline_reminder':
        return Icons.access_time_rounded;
      case 'project_update':
        return Icons.folder_rounded;
      case 'member_joined':
        return Icons.person_add_rounded;
      case 'member_left':
        return Icons.person_remove_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'project_invitation':
        return Colors.blue;
      case 'task_assigned':
        return Colors.green;
      case 'task_updated':
        return Colors.orange;
      case 'task_completed':
        return Colors.grey;
      case 'mention':
        return Colors.purple;
      case 'deadline_reminder':
        return Colors.red;
      case 'project_update':
        return Colors.indigo;
      case 'member_joined':
        return Colors.teal;
      case 'member_left':
        return Colors.brown;
      default:
        return Colors.blue;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }

  void _handleInvitationAction(int invitationId, bool accept) {
    if (accept) {
      context.read<InvitationBloc>().add(AcceptInvitation(invitationId));
    } else {
      context.read<InvitationBloc>().add(DeclineInvitation(invitationId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const DashboardPage()),
              (route) => false,
            );
          },
        ),
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          BlocBuilder<NotificationBloc, NotificationState>(
            builder: (context, state) {
              bool hasNotifications = false;
              if (state is NotificationLoaded) {
                hasNotifications = state.notifications.isNotEmpty;
              }
              return TextButton(
                onPressed: hasNotifications ? _clearAll : null,
                child: Text(
                  "Clear All",
                  style: TextStyle(
                    color: hasNotifications ? Colors.blue : Colors.grey,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<NotificationBloc, NotificationState>(
            listener: (context, state) {
              if (state is NotificationActionSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.green,
                  ),
                );
              } else if (state is NotificationError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
          BlocListener<InvitationBloc, InvitationState>(
            listener: (context, state) {
              if (state is InvitationActionSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.green,
                  ),
                );
                // Reload notifications after invitation action
                context.read<NotificationBloc>().add(const LoadNotifications());
              } else if (state is InvitationError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
        ],
        child: BlocBuilder<NotificationBloc, NotificationState>(
          builder: (context, state) {
            if (state is NotificationLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            } else if (state is NotificationError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load notifications',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.message,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[500],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        context.read<NotificationBloc>().add(const LoadNotifications());
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            } else if (state is NotificationLoaded) {
              if (state.notifications.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.notifications_none,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No notifications yet',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'You\'ll see notifications here when you receive them',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[500],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  context.read<NotificationBloc>().add(const LoadNotifications());
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final notification = state.notifications[index];
                    return _buildNotificationCard(notification);
                  },
                ),
              );
            }

            return const Center(
              child: CircularProgressIndicator(),
            );
          },
        ),
      ),
    );
  }

  Widget _buildNotificationCard(notification_entity.Notification notification) {
    final icon = _getNotificationIcon(notification.type);
    final color = _getNotificationColor(notification.type);
    final time = _formatTime(notification.createdAt);

    return Container(
      decoration: BoxDecoration(
        color: notification.isRead ? Colors.white : Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: notification.isRead 
            ? null 
            : Border.all(color: Colors.blue.withOpacity(0.2), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.07),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.15),
          child: Icon(icon, color: color, size: 28),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w700,
            fontSize: 15,
            color: const Color(0xFF181929),
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              notification.message,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF7B7F9E),
                fontWeight: FontWeight.w400,
              ),
            ),
            if (notification.actor != null) ...[
              const SizedBox(height: 4),
              Text(
                'by ${notification.actor}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              time,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.black38,
              ),
            ),
          ],
        ),
        trailing: notification.type == 'project_invitation'
            ? _buildInvitationActions(notification)
            : IconButton(
                icon: Icon(
                  notification.isRead ? Icons.more_vert : Icons.circle,
                  color: notification.isRead ? Colors.black38 : Colors.blue,
                  size: notification.isRead ? 24 : 12,
                ),
                onPressed: () {
                  if (!notification.isRead) {
                    context.read<NotificationBloc>().add(MarkAsRead(notification.id));
                  }
                },
              ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        onTap: () {
          if (!notification.isRead) {
            context.read<NotificationBloc>().add(MarkAsRead(notification.id));
          }
        },
      ),
    );
  }

  Widget _buildInvitationActions(notification_entity.Notification notification) {
    return BlocBuilder<InvitationBloc, InvitationState>(
      builder: (context, invitationState) {
        if (invitationState is InvitationLoading) {
          return const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          );
        }

        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextButton(
              onPressed: () {
                // Extract invitation ID from notification (you might need to adjust this based on your data structure)
                final invitationId = notification.id; // This might need adjustment
                _handleInvitationAction(invitationId, true);
              },
              style: TextButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Accept',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: () {
                final invitationId = notification.id; // This might need adjustment
                _handleInvitationAction(invitationId, false);
              },
              style: TextButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Decline',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }
}