import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/dashboard/presentation/pages/project_overview_page.dart';
import 'package:mycrewmanager/features/dashboard/widgets/addmember_widget.dart';
import 'package:mycrewmanager/features/dashboard/widgets/modifymember_widget.dart';
import 'package:mycrewmanager/features/project/domain/entities/project.dart';
import 'package:mycrewmanager/features/project/domain/entities/member.dart';
import 'package:mycrewmanager/features/project/domain/usecases/get_project_members.dart';
import 'package:mycrewmanager/features/project/domain/usecases/create_member.dart';
import 'package:mycrewmanager/features/project/domain/usecases/delete_member.dart';
import 'package:mycrewmanager/core/utils/show_snackbar.dart';
import 'package:mycrewmanager/init_dependencies.dart';
import 'package:mycrewmanager/features/dashboard/widgets/skeleton_loader.dart';

class ManageMembersPage extends StatefulWidget {
  final Project? project;
  
  const ManageMembersPage({super.key, this.project});

  static Route<Object?> route([Project? project]) => MaterialPageRoute(
    builder: (_) => ManageMembersPage(project: project)
  );

  @override
  State<ManageMembersPage> createState() => _ManageMembersPageState();
}

class _ManageMembersPageState extends State<ManageMembersPage> {
  String search = '';
  List<Member> members = [];
  bool isLoading = true;
  String? error;

  final GetProjectMembers _getProjectMembers = serviceLocator<GetProjectMembers>();
  final CreateMember _createMember = serviceLocator<CreateMember>();
  final DeleteMember _deleteMember = serviceLocator<DeleteMember>();

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    if (widget.project == null) {
      setState(() {
        isLoading = false;
        error = 'No project selected';
      });
      return;
    }

    setState(() {
      isLoading = true;
      error = null;
    });

    final result = await _getProjectMembers(GetProjectMembersParams(
      projectId: widget.project!.id,
    ));

    result.fold(
      (failure) {
        setState(() {
          isLoading = false;
          error = failure.message;
        });
      },
      (membersList) {
        setState(() {
          isLoading = false;
          members = membersList;
        });
      },
    );
  }

  Future<void> _addMember(String name, String role, String email) async {
    if (widget.project == null) return;

    // Show loading indicator
    showSnackBar(context, 'Adding member...', Colors.blue);

    final result = await _createMember(CreateMemberParams(
      name: name,
      role: role,
      email: email,
      projectId: widget.project!.id,
    ));

    result.fold(
      (failure) {
        // Provide user-friendly error messages
        String errorMessage = failure.message;
        if (failure.message.contains('Only the project creator can add members')) {
          errorMessage = 'Only the project creator can add members to this project.';
        } else if (failure.message.contains('already a member')) {
          errorMessage = 'This user is already a member of this project.';
        } else if (failure.message.contains('Project not found')) {
          errorMessage = 'Project not found. Please try again.';
        }
        
        showSnackBar(context, errorMessage, Colors.red);
      },
      (member) {
        setState(() {
          members.add(member);
        });
        showSnackBar(context, 'Member added successfully!', Colors.green);
      },
    );
  }

  Future<void> _removeMember(int memberId) async {
    // Show loading indicator
    showSnackBar(context, 'Removing member...', Colors.blue);

    final result = await _deleteMember(DeleteMemberParams(id: memberId));

    result.fold(
      (failure) {
        // Provide user-friendly error messages
        String errorMessage = failure.message;
        if (failure.message.contains('Only the project creator can remove members')) {
          errorMessage = 'Only the project creator can remove members from this project.';
        } else if (failure.message.contains('Member not found')) {
          errorMessage = 'Member not found. Please try again.';
        }
        
        showSnackBar(context, errorMessage, Colors.red);
      },
      (_) {
        setState(() {
          members.removeWhere((member) => member.id == memberId);
        });
        showSnackBar(context, 'Member removed successfully!', Colors.green);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = members
        .where((m) => m.name.toLowerCase().contains(search.toLowerCase()))
        .toList();

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      body: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 8, right: 8, bottom: 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87),
                      onPressed: () {
                        Navigator.of(context).pushReplacement(ProjectOverviewPage.route(widget.project));
                      },
                    ),
                    const Spacer(),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              // Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 4),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.project != null ? '${widget.project!.title} Team' : 'Project Team',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF181929),
                        ),
                      ),
                      if (widget.project != null)
                        Text(
                          'Created by: ${widget.project!.createdByName}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.normal,
                            color: Color(0xFF666666),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Search bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search Projects',
                    prefixIcon: const Icon(Icons.search),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFFE8ECF4),
                      ),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    isDense: true,
                  ),
                  onChanged: (val) => setState(() => search = val),
                ),
              ),
              const SizedBox(height: 16),
              // Project avatar and name
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundImage: AssetImage('lib/core/assets/images/app_logo.png'),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'My Crew Tasker',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                        color: Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Permission notice
              if (widget.project != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade600, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Only the project creator can add or remove members.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              // Members list
              Expanded(
                child: isLoading
                    ? ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: 4,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, __) => const MemberCardSkeleton(),
                      )
                    : error != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  error!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: _loadMembers,
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          )
                        : filtered.isEmpty
                            ? const Center(
                                child: Text(
                                  'No members found',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
                                itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(indent: 80, endIndent: 16, height: 1),
                  itemBuilder: (context, i) {
                    final m = filtered[i];
                    return ListTile(
                      leading: CircleAvatar(
                        radius: 28,
                        backgroundImage: NetworkImage(m.avatar),
                      ),
                      title: Text(
                        m.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                          color: Colors.black,
                        ),
                      ),
                      subtitle: Text(
                        m.role,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black54,
                        ),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.more_horiz, color: Colors.black87),
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                            ),
                            builder: (_) => ModifyMemberBottomSheet(
                              name: m.name,
                              role: m.role,
                              avatarUrl: m.avatar,
                            ),
                          );
                        },
                      ),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Tapped: ${m.name}')),
                        );
                      },
                    );
                  },
                ),
              ),
              // Add Member button
              Padding(
                padding: const EdgeInsets.only(bottom: 24, right: 16, top: 8),
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    ),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.w600)),
                    onPressed: () async {
                      final result = await showModalBottomSheet<Map<String, dynamic>>(
                        context: context,
                        isScrollControlled: true,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                        ),
                        builder: (_) => const AddMemberBottomSheet(),
                      );

                      if (result != null) {
                        await _addMember(
                          result["name"] ?? "Unknown User",
                          result["role"] ?? "Member",
                          result["email"] ?? "",
                        );
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}