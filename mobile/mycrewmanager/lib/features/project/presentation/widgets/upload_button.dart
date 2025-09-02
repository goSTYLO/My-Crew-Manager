import 'package:flutter/material.dart';
import 'package:mycrewmanager/core/theme/pallete.dart';

class UploadButton extends StatelessWidget {
  final String buttonText;
  final VoidCallback onPressed;
  final Color color = Colors.grey;

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
          color: Colors.black),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          fixedSize: Size(195, 45),
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
