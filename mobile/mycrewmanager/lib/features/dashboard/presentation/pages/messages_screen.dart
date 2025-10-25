import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import 'package:mycrewmanager/features/authentication/presentation/bloc/auth_bloc.dart';
import 'package:mycrewmanager/features/authentication/presentation/pages/login_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/settings_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/tasks_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/projects_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/notifications_page.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/chats_page.dart';
import 'package:mycrewmanager/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:mycrewmanager/features/chat/data/models/room_model.dart';
import 'package:mycrewmanager/features/chat/data/services/chat_ws_service.dart';
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
  bool _showFabMenu = false;

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

  Future<void> _showCreateGroupDialog() async {
    final controller = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                const Text(
                  'Create Group',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF181929),
                  ),
                ),
                const SizedBox(height: 20),
                // Input field
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFE8ECF4),
                      width: 1,
                    ),
                  ),
                  child: TextField(
                    controller: controller,
                    decoration: const InputDecoration(
                      hintText: 'Group name',
                      hintStyle: TextStyle(
                        color: Color(0xFF7B7F9E),
                        fontSize: 16,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            color: Color(0xFF6C63FF),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6C63FF),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Create',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                const Text(
                  'Direct Chat',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF181929),
                  ),
                ),
                const SizedBox(height: 20),
                // Input field
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFE8ECF4),
                      width: 1,
                    ),
                  ),
                  child: TextField(
                    controller: controller,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'User email',
                      hintStyle: TextStyle(
                        color: Color(0xFF7B7F9E),
                        fontSize: 16,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF181929),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            color: Color(0xFF6C63FF),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6C63FF),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Start',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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

  Widget _buildFabMenuItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF6C63FF), size: 24),
            const SizedBox(width: 16),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF181929),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showFabMenu = !_showFabMenu),
        backgroundColor: const Color(0xFF6C63FF),
        child: Icon(
          _showFabMenu ? Icons.close : Icons.add,
          color: Colors.white,
        ),
      ),
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

           // FAB Popup Menu
           if (_showFabMenu)
             Positioned(
               bottom: 100,
               right: 16,
               child: Container(
                 width: 200,
                 decoration: BoxDecoration(
                   color: Colors.white,
                   borderRadius: BorderRadius.circular(16),
                   boxShadow: [
                     BoxShadow(
                       color: Colors.black.withOpacity(0.15),
                       blurRadius: 25,
                       offset: const Offset(0, 6),
                     ),
                   ],
                 ),
                 child: Column(
                   mainAxisSize: MainAxisSize.min,
                   children: [
                     _buildFabMenuItem(
                       icon: Icons.group,
                       label: 'Create Group',
                       onTap: () {
                         setState(() => _showFabMenu = false);
                         _showCreateGroupDialog();
                       },
                     ),
                     _buildFabMenuItem(
                       icon: Icons.person,
                       label: 'Direct Chat',
                       onTap: () {
                         setState(() => _showFabMenu = false);
                         _showCreateDirectDialog();
                       },
                     ),
                   ],
                 ),
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
                      const CircleAvatar(
                        radius: 28,
                        backgroundImage:
                            AssetImage('lib/core/assets/images/app_logo.png'),
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
                _DrawerItem(
                    icon: Icons.home_outlined,
                    label: 'Home',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, DashboardPage.route());
                    }),
                _DrawerItem(
                    icon: Icons.folder_open,
                    label: 'Projects',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, ProjectsPage.route());
                    }),
                if (RoleFormatter.getRoleForComparison(
                        state is AuthSuccess ? state.user.role : null) !=
                    'developer')
                  _DrawerItem(
                      icon: Icons.description_outlined,
                      label: 'Tasks',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, TasksPage.route());
                      }),
                _DrawerItem(
                    icon: Icons.chat_bubble_outline,
                    label: 'Messages',
                    onTap: () {
                      Navigator.pop(context);
                    }),
                _DrawerItem(
                    icon: Icons.notifications_none,
                    label: 'Notifications',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, NotificationsPage.route());
                    }),
                _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, SettingsPage.route());
                    }),
                _DrawerItem(
                    icon: Icons.logout,
                    label: 'Logout',
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Logout'),
                          content:
                              const Text('Are you sure you want to logout?'),
                          actions: [
                            TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Cancel')),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(ctx);
                                Navigator.pushReplacement(
                                    context, LoginPage.route());
                              },
                              child: const Text('Logout'),
                            ),
                          ],
                        ),
                      );
                    }),
              ],
            ),
          ),
        );
      },
    );
  }
}

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
