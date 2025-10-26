import 'package:flutter/material.dart';
import 'package:mycrewmanager/core/theme/pallete.dart';

class UploadButton extends StatelessWidget {
  final String buttonText;
  final VoidCallback onPressed;
  final Color color = const Color.fromARGB(255, 255, 255, 255);

  const UploadButton({
    super.key,
    required this.buttonText,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          // gradient: LinearGradient(
          //   colors: [AppPallete.gradient1, AppPallete.gradient2],
          //   begin: Alignment.bottomLeft,
          //   end: Alignment.topRight,
          // ),
          // borderRadius: BorderRadius.circular(7),
          borderRadius: BorderRadius.circular(7),
          color: const Color(0x9C036EFF)),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          fixedSize: Size(135, 45),
          backgroundColor: AppPallete.transparentColor,
          shadowColor: AppPallete.transparentColor,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_outlined,
              color: color,
            ),
            Text(
              buttonText,
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
