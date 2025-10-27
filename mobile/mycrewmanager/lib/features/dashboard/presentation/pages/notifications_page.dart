import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_bloc.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_event.dart';
import 'package:mycrewmanager/features/notification/presentation/bloc/notification_state.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_bloc.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_event.dart';
import 'package:mycrewmanager/features/invitation/presentation/bloc/invitation_state.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/chats_page.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  static Route<Object?> route() => MaterialPageRoute(builder: (_) => const NotificationsPage());

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final _ws = GetIt.I<ChatWsService>();
  final List<Map<String, dynamic>> _messageNotifications = [];
  bool _wsConnected = false;

  @override
  void initState() {
    super.initState();
    // Load notifications and invitations when the page opens
    context.read<NotificationBloc>().add(const LoadNotifications());
    context.read<InvitationBloc>().add(const LoadInvitations());
    _connectToMessageNotifications();
  }

  Future<void> _connectToMessageNotifications() async {
    if (_wsConnected) return;
    try {
      final stream = await _ws.connectToNotifications();
      _wsConnected = true;
      
      stream.listen((event) {
        if (event is Map<String, dynamic>) {
          final type = event['type'] as String?;
          if (type == 'new_message') {
            _handleNewMessageNotification(event);
          }
        }
      }, onError: (error) {
        _wsConnected = false;
      }, onDone: () {
        _wsConnected = false;
      });
    } catch (e) {
      _wsConnected = false;
    }
  }

  void _handleNewMessageNotification(Map<String, dynamic> event) {
    final roomId = event['room_id'] as int?;
    final message = event['message'] as Map<String, dynamic>?;
    final sender = event['sender'] as String?;
    
    if (roomId == null || message == null || sender == null) {
      return;
    }
    
    // Get current user info to check if this is our own message
    final authState = context.read<AuthBloc>().state;
    String? currentUserId;
    if (authState is AuthSuccess) {
      currentUserId = authState.user.id;
    }
    
    // Don't add notification for our own messages
    final senderId = message['sender_id'] as int?;
    if (senderId != null && currentUserId != null && senderId.toString() == currentUserId) {
      return;
    }
    
    final messageContent = message['content'] as String? ?? '';
    final preview = messageContent.length > 100 
        ? '${messageContent.substring(0, 100)}...' 
        : messageContent;
    
    final messageNotification = {
      'id': 'msg_${message['message_id']}_${DateTime.now().millisecondsSinceEpoch}',
      'type': 'new_message',
      'title': 'New message from $sender',
      'message': preview,
      'isRead': false,
      'createdAt': DateTime.now(),
      'actor': sender,
      'roomId': roomId,
      'messageId': message['message_id'],
    };
    
    setState(() {
      _messageNotifications.insert(0, messageNotification);
      // Keep only last 50 message notifications to prevent memory issues
      if (_messageNotifications.length > 50) {
        _messageNotifications.removeRange(50, _messageNotifications.length);
      }
    });
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
      case 'new_message':
        return Icons.message_rounded;
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
      case 'new_message':
        return const Color(0xFF6C63FF);
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
    // Reload notifications to apply filtering (accepted invitations will be filtered out)
    context.read<NotificationBloc>().add(const LoadNotifications());
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
              // Combine regular notifications with message notifications
              final allNotifications = <Map<String, dynamic>>[];
              
              // Add regular notifications
              for (final notification in state.notifications) {
                allNotifications.add({
                  'id': notification.id,
                  'type': notification.type,
                  'title': notification.title,
                  'message': notification.message,
                  'isRead': notification.isRead,
                  'createdAt': notification.createdAt,
                  'actor': notification.actor,
                  'objectId': notification.objectId,
                  'actionUrl': notification.actionUrl,
                  'isRegularNotification': true,
                });
              }
              
              // Add message notifications
              allNotifications.addAll(_messageNotifications);
              
              // Sort by creation time (newest first)
              allNotifications.sort((a, b) {
                final aTime = a['createdAt'] as DateTime;
                final bTime = b['createdAt'] as DateTime;
                return bTime.compareTo(aTime);
              });
              
              if (allNotifications.isEmpty) {
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
                  itemCount: allNotifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final notification = allNotifications[index];
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

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final type = notification['type'] as String;
    final icon = _getNotificationIcon(type);
    final color = _getNotificationColor(type);
    final time = _formatTime(notification['createdAt'] as DateTime);
    final isRead = notification['isRead'] as bool;
    final title = notification['title'] as String;
    final message = notification['message'] as String;
    final actor = notification['actor'] as String?;
    final isRegularNotification = notification['isRegularNotification'] as bool? ?? false;

    return Container(
      decoration: BoxDecoration(
        color: isRead ? Colors.white : Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: isRead 
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
          title,
          style: TextStyle(
            fontWeight: isRead ? FontWeight.w600 : FontWeight.w700,
            fontSize: 15,
            color: const Color(0xFF181929),
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF7B7F9E),
                fontWeight: FontWeight.w400,
              ),
            ),
            if (actor != null) ...[
              const SizedBox(height: 4),
              Text(
                'by $actor',
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
        trailing: type == 'project_invitation' && isRegularNotification
            ? _buildInvitationActions(notification)
            : IconButton(
                icon: Icon(
                  isRead ? Icons.more_vert : Icons.circle,
                  color: isRead ? Colors.black38 : Colors.blue,
                  size: isRead ? 24 : 12,
                ),
                onPressed: () {
                  if (!isRead) {
                    if (isRegularNotification) {
                      context.read<NotificationBloc>().add(MarkAsRead(notification['id'] as int));
                    } else {
                      // Mark message notification as read
                      setState(() {
                        notification['isRead'] = true;
                      });
                    }
                  }
                },
              ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        onTap: () {
          if (!isRead) {
            if (isRegularNotification) {
              context.read<NotificationBloc>().add(MarkAsRead(notification['id'] as int));
            } else {
              // Mark message notification as read
              setState(() {
                notification['isRead'] = true;
              });
            }
          }
          
          // Navigate to chat if it's a message notification
          if (type == 'new_message' && !isRegularNotification) {
            final roomId = notification['roomId'] as int?;
            if (roomId != null) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatsPage(
                    roomId: roomId,
                    name: 'Chat Room',
                    avatarUrl: 'https://ui-avatars.com/api/?name=C',
                  ),
                ),
              );
            }
          }
        },
      ),
    );
  }

  Widget _buildInvitationActions(Map<String, dynamic> notification) {
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
                // Use objectId which contains the invitation ID
                final invitationId = notification['objectId'] as int?;
                if (invitationId != null) {
                  _handleInvitationAction(invitationId, true);
                }
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
                // Use objectId which contains the invitation ID
                final invitationId = notification['objectId'] as int?;
                if (invitationId != null) {
                  _handleInvitationAction(invitationId, false);
                }
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