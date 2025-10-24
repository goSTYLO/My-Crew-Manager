import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/chats_page.dart'; 
import 'package:get_it/get_it.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/models/room_model.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();

  static Route<Object?> route() {
    return MaterialPageRoute(builder: (_) => const MessagesScreen());
  }
}

class _MessagesScreenState extends State<MessagesScreen> {
  final _repo = GetIt.I<ChatRepositoryImpl>();
  List<RoomModel> _rooms = [];
  bool _loading = true;
  String _error = '';
  String search = '';
  final _ws = GetIt.I<ChatWsService>();
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
      setState(() {
        _rooms = rooms;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load rooms';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
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

  Future<void> _showCreateGroupDialog() async {
    final controller = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Group'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Group name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Create')),
        ],
      ),
    );
    if (created == true) {
      final name = controller.text.trim();
      if (name.isEmpty) return;
      try {
        await _repo.createRoom(name);
        _loadRooms();
      } catch (_) {}
    }
  }

  Future<void> _showCreateDirectDialog() async {
    final controller = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Direct Chat'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'User email'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Start')),
        ],
      ),
    );
    if (created == true) {
      final email = controller.text.trim();
      if (email.isEmpty) return;
      try {
        await _repo.direct(email);
        _loadRooms();
      } catch (_) {}
    }
  }

  Widget _buildAppDrawer(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String userName = 'User';
        String userRole = 'User';
        
        if (state is AuthSuccess) {
          userName = state.user.name;
          userRole = state.user.role ?? 'User';
        }

        return Drawer(
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                DrawerHeader(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF7F8FA),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile picture
                      const CircleAvatar(
                        radius: 28,
                        backgroundImage: AssetImage(
                          'lib/core/assets/images/app_logo.png',
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Name
                      Text(
                        userName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Colors.black,
                        ),
                      ),
                      // Title/Role
                      Text(
                        userRole,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                      ),
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

  @override
  Widget build(BuildContext context) {
    // Set status bar color to white and icons to dark
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.white, // Remove green, set to white
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );

    final filtered = _rooms
        .where((r) => (r.name ?? 'Direct').toLowerCase().contains(search.toLowerCase()))
        .toList();

    return Scaffold(
        drawer: _buildAppDrawer(context),
      backgroundColor: Colors.white, // Set scaffold background to white
      body: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.only(
                  left: 16, right: 16, top: 24, bottom: 8),
              child: Row(
                children: [
                  Builder(
                    builder: (context) => IconButton(
                      icon: const Icon(Icons.menu),
                      onPressed: () {
                        Scaffold.of(context).openDrawer();
                      },
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_outlined),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            // Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Message',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF181929),
                  ),
                ),
              ),
            ),
            // Search bar and filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search Mentors',
                        prefixIcon: const Icon(Icons.search),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE8ECF4),
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF7F7FA),
                        isDense: true,
                      ),
                      onChanged: (val) => setState(() => search = val),
                    ),
                  ),
                ],
              ),
            ),
            // Message list
            if (_loading)
              const Expanded(child: Center(child: CircularProgressIndicator()))
            else if (_error.isNotEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error),
                      const SizedBox(height: 8),
                      ElevatedButton(onPressed: _loadRooms, child: const Text('Retry')),
                    ],
                  ),
                ),
              )
            else
              Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 2),
                itemBuilder: (context, i) {
                  final room = filtered[i];
                  return ListTile(
                    leading: const CircleAvatar(radius: 24, child: Icon(Icons.group)),
                    title: Text(
                      room.name ?? 'Direct chat #${room.roomId}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      'Members: ${room.membersCount}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: const Color(0xFF181929),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    trailing: Text(room.createdAt.split('T').first, style: const TextStyle(fontSize: 11, color: Colors.black45)),
                    onTap: () {
                      // Navigate to chat detail with room info
                      Navigator.of(context).push(
                        ChatsPage.route(
                          name: room.name ?? 'Direct',
                          avatarUrl: 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(room.name ?? 'D')}',
                          roomId: room.roomId,
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _showCreateGroupDialog,
                    icon: const Icon(Icons.group_add),
                    label: const Text('Create Group'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _showCreateDirectDialog,
                    icon: const Icon(Icons.person_add),
                    label: const Text('Direct Chat'),
                  ),
                ),
              ],
            ),
          ),
          ],
        ),
      ),
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

