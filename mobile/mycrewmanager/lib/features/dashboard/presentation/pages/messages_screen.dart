import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/chats_page.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/models/room_model.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
import 'package:mycrewmanager/core/constants/constants.dart';
import 'package:mycrewmanager/core/utils/role_formatter.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  static Route<Object?> route() {
    return MaterialPageRoute(builder: (_) => const MessagesScreen());
  }

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final _repo = GetIt.I<ChatRepositoryImpl>();
  final _ws = GetIt.I<ChatWsService>();

  List<RoomModel> _rooms = [];
  bool _loading = true;
  String _error = '';
  String _search = '';
  bool _wsConnected = false;

  @override
  void initState() {
    super.initState();
    _loadRooms();
    _connectNotifications();
  }

  Future<void> _loadRooms() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final rooms = await _repo.listRooms();
      if (!mounted) return;
      setState(() => _rooms = rooms);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load rooms');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _connectNotifications() async {
    if (_wsConnected) return;
    try {
      final stream = await _ws.connectToNotifications();
      _wsConnected = true;
      stream.listen((event) {
        if (event is Map<String, dynamic>) {
          final type = event['type'] as String?;
          if (type == 'room_invitation' || type == 'direct_room_created') {
            _loadRooms();
          }
        }
      });
    } catch (_) {}
  }



  Widget _buildChatItem(RoomModel room) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: const Color(0xFF6C63FF).withOpacity(0.1),
          child: Icon(
            room.name != null ? Icons.group : Icons.person,
            color: const Color(0xFF6C63FF),
            size: 24,
          ),
        ),
        title: Text(
          room.name ?? 'Direct',
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: Color(0xFF181929),
          ),
        ),
        subtitle: Text(
          'Members: ${room.membersCount}',
          style: const TextStyle(
            color: Color(0xFF7B7F9E),
            fontSize: 14,
          ),
        ),
        onTap: () {
          Navigator.of(context).push(
            ChatsPage.route(
              name: room.name ?? 'Direct',
              avatarUrl:
                  'https://ui-avatars.com/api/?name=${Uri.encodeComponent(room.name ?? 'D')}',
              roomId: room.roomId,
            ),
          );
        },
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Color(0xFFF8F6FF),
      statusBarIconBrightness: Brightness.dark,
    ));

    final filtered = _rooms
        .where((r) =>
            (r.name ?? 'Direct').toLowerCase().contains(_search.toLowerCase()))
        .toList();

    return Scaffold(
      drawer: _buildAppDrawer(context),
      backgroundColor: const Color(0xFFF8F6FF),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Builder(
                        builder: (context) => IconButton(
                          icon: const Icon(Icons.menu, color: Color(0xFF181929)),
                          onPressed: () => Scaffold.of(context).openDrawer(),
                        ),
                      ),
                      const Spacer(),
                    ],
                  ),
                ),

                // Header + Search
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Messages',
                        style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF181929)),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Connect with your mentors and peers.',
                        style: TextStyle(
                            fontSize: 16,
                            color: Color(0xFF7B7F9E),
                            fontWeight: FontWeight.w400),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          onChanged: (value) =>
                              setState(() => _search = value),
                          decoration: const InputDecoration(
                            hintText: 'Search mentors or groups',
                            hintStyle: TextStyle(
                                color: Color(0xFF7B7F9E), fontSize: 16),
                            prefixIcon: Icon(Icons.search,
                                color: Color(0xFF7B7F9E), size: 20),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 16, vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Chat list
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: _loading
                        ? ListView.separated(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            itemCount: 5,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, __) => const ChatListSkeleton(),
                          )
                        : _error.isNotEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(_error,
                                        style:
                                            const TextStyle(color: Colors.red)),
                                    const SizedBox(height: 8),
                                    ElevatedButton(
                                        onPressed: _loadRooms,
                                        child: const Text('Retry')),
                                  ],
                                ),
                              )
                            : filtered.isEmpty
                                ? const Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.chat_bubble_outline,
                                            size: 64,
                                            color: Color(0xFF7B7F9E)),
                                        SizedBox(height: 16),
                                        Text('No conversations yet',
                                            style: TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF181929))),
                                        SizedBox(height: 8),
                                        Text(
                                          'Start a conversation with your team',
                                          style: TextStyle(
                                              fontSize: 14,
                                              color: Color(0xFF7B7F9E)),
                                        ),
                                      ],
                                    ),
                                  )
                                : ListView.separated(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 16),
                                    itemCount: filtered.length,
                                    separatorBuilder: (_, __) =>
                                        const SizedBox(height: 12),
                                    itemBuilder: (context, i) =>
                                        _buildChatItem(filtered[i]),
                                  ),
                  ),
                ),
              ],
            ),
          ),

        ],
      ),
    );
  }

  Widget _buildAppDrawer(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String userName = 'User';
        String userRole = 'User';

        if (state is AuthSuccess) {
          userName = state.user.name;
          userRole = RoleFormatter.formatRole(state.user.role);
        }

        return Drawer(
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DrawerHeader(
                  decoration: const BoxDecoration(color: Color(0xFFF7F8FA)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: (state is AuthSuccess && state.user.profilePicture != null)
                            ? NetworkImage('${Constants.baseUrl.replaceAll('/api/', '')}${state.user.profilePicture!}')
                            : const AssetImage(
                                'lib/core/assets/images/app_logo.png',
                              ) as ImageProvider,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        userName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      Text(userRole,
                          style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
            // Menu Items
            _DrawerItem(
              icon: Icons.home_outlined,
              label: 'Home',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, DashboardPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.folder_open,
              label: 'Projects',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, ProjectsPage.route());
              },
            ),
            // Hide Tasks menu item for developers
            if (userRole.toLowerCase() != 'developer')
              _DrawerItem(
                icon: Icons.description_outlined,
                label: 'Tasks',
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(context, TasksPage.route());
                },
              ),
            _DrawerItem(
              icon: Icons.chat_bubble_outline,
              label: 'Messages',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MessagesScreen.route());
              },
            ),
            _DrawerItem(
              icon: Icons.notifications_none,
              label: 'Notifications',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, NotificationsPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, SettingsPage.route());
              },
            ),
            _DrawerItem(
              icon: Icons.logout,
              label: 'Logout',
              onTap: () {
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      title: const Text('Logout'),
                      content: const Text('Are you sure you want to logout?'),
                      actions: [
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () {
                            Navigator.pop(context); // Close dialog
                            context.read<AuthBloc>().add(AuthLogout());
                          },
                          child: const Text('Logout'),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
                const Spacer(),
              ],
            ),
          ),
        );
      },
    );
  }

}

// Drawer item widget
class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.black87),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }
}
