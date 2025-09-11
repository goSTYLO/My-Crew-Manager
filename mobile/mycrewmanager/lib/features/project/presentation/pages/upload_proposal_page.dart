import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:mycrewmanager/features/project/presentation/widgets/upload_button.dart';

class ProposalPage extends StatefulWidget {
  static route() => MaterialPageRoute(builder: (context) => const ProposalPage());
  const ProposalPage({super.key});

  @override
  State<ProposalPage> createState() => _ProposalPageState();
}

class _ProposalPageState extends State<ProposalPage> {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color.fromARGB(255, 255, 255, 255),
      // backgroundColor: const Color.fromARGB(255, 23, 26, 89),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.only(top: 40),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Proposal Upload',
                    style: TextStyle(
                      color: Color.fromARGB(255, 0, 0, 0),
                      fontSize: 12,
                      fontWeight: FontWeight.normal,
                      decoration: TextDecoration.none,
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color.fromARGB(
                          255,
                          0,
                          0,
                          0,
                        ), // Outline color
                        width: 0.8, // Border thickness
                      ),
                      borderRadius: BorderRadius.circular(
                        5,
                      ), // Optional: rounded corners
                    ),
                    child: const Text(
                      'PM Only',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 12,
                        decoration: TextDecoration.none,
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Container(
              height: 250,
              width: 600,
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Upload New Proposal',
                    style: TextStyle(
                      color: Colors.black,
                      decoration: TextDecoration.none,
                      fontSize: 14,
                    ),
                  ),
                  DottedBorder(
                    options: RoundedRectDottedBorderOptions(
                      radius: const Radius.circular(8),
                      color: const Color.fromARGB(255, 183, 183, 190),
                      dashPattern: const [5, 6],
                      strokeCap: StrokeCap.round,
                      strokeWidth: 1.5,
                    ),
                    child: SizedBox(
                      height: 250,
                      width: double.infinity,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          children: [
                            Icon(
                              Icons.file_upload_outlined,
                              size: 40,
                              color: Color.fromARGB(255, 195, 186, 186),
                            ),
                            SizedBox(height: 15),
                            Text(
                              "Drop your proposal document here or click to brows",
                              style: TextStyle(
                                fontSize: 12,
                                color: Color.fromARGB(255, 181, 175, 175),
                                decoration: TextDecoration.none,
                              ),
                              maxLines: 2,
                              textAlign: TextAlign.center,
                            ),
                            Text(
                              'Supports PDF, DOC, DOCX up to 10MB',
                              style: TextStyle(
                                fontSize: 10,
                                color: Color.fromARGB(255, 50, 37, 37),
                                decoration: TextDecoration.none,
                              ),
                            ),
                            UploadButton(
                                buttonText: 'Choose File', onPressed: () {})
                          ],
                        ),
                      ),
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
