import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/project/presentation/widgets/upload_button.dart';

class UploadProposalTab extends StatefulWidget {
  const UploadProposalTab({super.key});

  @override
  State<UploadProposalTab> createState() => _UploadProposalTabState();
}

class _UploadProposalTabState extends State<UploadProposalTab> {
  // Simulate uploaded files
  List<Map<String, dynamic>> uploadedFiles = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    alignment: const Alignment(-1, 0),
                    child: const Text(
                      "Upload your project proposal",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Upload a PDF document. Our AI will analyze it and generate a summary.",
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 20),
                  DottedBorder(
                    options: RoundedRectDottedBorderOptions(
                      radius: const Radius.circular(8),
                      color: const Color.fromARGB(255, 183, 183, 190),
                      dashPattern: const [6, 6],
                      strokeCap: StrokeCap.round,
                      strokeWidth: 1.5,
                    ),
                    child: SizedBox(
                      height: 180,
                      width: double.infinity,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.file_upload_outlined,
                              size: 40,
                              color: Color.fromARGB(255, 195, 186, 186),
                            ),
                            const SizedBox(height: 15),
                            const Text(
                              "Import your proposal",
                              style: TextStyle(
                                fontSize: 12,
                                color: Color.fromARGB(255, 181, 175, 175),
                                decoration: TextDecoration.none,
                              ),
                              maxLines: 2,
                              textAlign: TextAlign.center,
                            ),
                            const Text(
                              'PDF files up to 10MB',
                              style: TextStyle(
                                fontSize: 10,
                                color: Color.fromARGB(255, 50, 37, 37),
                                decoration: TextDecoration.none,
                              ),
                            ),
                            UploadButton(
                              buttonText: 'Choose File',
                              onPressed: () {
                                // Simulate file upload
                                setState(() {
                                  uploadedFiles.add({
                                    'name': 'project_proposal.pdf',
                                    'size': '923KB',
                                  });
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Uploaded files list
                  if (uploadedFiles.isNotEmpty)
                    ...uploadedFiles.map((file) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(file['name'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                    Text(file['size'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, color: Colors.red),
                                onPressed: () {
                                  setState(() {
                                    uploadedFiles.remove(file);
                                  });
                                },
                              ),
                            ],
                          ),
                        )),
                  // Tips for Uploading (only show if no file uploaded)
                  if (uploadedFiles.isEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 24, bottom: 80),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Tips for Uploading',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text('• Ensure your proposal is clean and well-structured.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text('• Include project scope, objectives, and timeline.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text('• Check for any sensitive information before uploading.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      ),
                    ),
                  SizedBox(height: MediaQuery.of(context).size.height * 0.18), // Spacer for button
                ],
              ),
            ),
          ),
          // Fixed Analyze Project button
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: uploadedFiles.isNotEmpty ? () {} : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  "Analyze Project",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
