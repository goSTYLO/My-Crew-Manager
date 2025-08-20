import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_export.dart';
import '../../core/utils/image_constant.dart';
import '../../theme/text_style_helper.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_button.dart';
import 'widgets/activity_chart_widget.dart';
import 'widgets/calendar_widget.dart'; // Make sure this file exists and defines CalendarWidget
import 'widgets/mentor_card_widget.dart';
import 'widgets/running_task_widget.dart';
import 'widgets/task_card_widget.dart';
import 'widgets/task_detail_widget.dart';
// import '../../core/extensions/size_extension.dart'; // For .h extension
import '../../theme/app_theme.dart'; // For AppTheme

class TaskDashboardScreen extends ConsumerWidget {
  TaskDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    int currentMentorIndex = 0;

    // Get user name from auth state
    String userName = 'User';

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(108),
        child: CustomAppBar(
          height: 108,
          backgroundColor: AppTheme.colorFFFFFF,
          logoPath: ImageConstant.imgMenu,
          title: '',
          titleStyle: TextStyleHelper.instance.headline24SemiBold,
          onLogoPressed: () {
            print('Menu toggled');
          },
          actionIconPath: ImageConstant.imgIconlyLightNotification,
          onActionPressed: () {
            print('Notifications shown');
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              color: AppTheme.colorFFFBFB,
              padding: EdgeInsets.symmetric(horizontal: 36),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildGreetingSection(userName),
                  RunningTaskWidget(),
                  SizedBox(height: 24),
                  ActivityChartWidget(),
                  SizedBox(height: 24), // Remove .h if not using ScreenUtil
                  _buildMentorsSection(ref, currentMentorIndex),
                  _buildUpcomingTaskSection(ref),
                ],
              ),
            ),
            Container(
              color: AppTheme.colorFFFBFB,
              padding: EdgeInsets.symmetric(horizontal: 36), // Remove .h if not using ScreenUtil
              child: Column(
                children: [
                  SizedBox(height: 24), // Remove .h if not using ScreenUtil
                  CalendarWidget(),
                  SizedBox(height: 24),
                  TaskDetailWidget(),
                  SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGreetingSection(String userName) {
    return Padding(
      padding: EdgeInsets.only(top: 32, bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hi, $userName',
            style: TextStyleHelper.instance.headline24SemiBold,
          ),
          SizedBox(height: 8),
          Text(
            'Let\'s finish your task today!',
            style: TextStyleHelper.instance.body14Medium
                .copyWith(color: AppTheme.colorFF5457),
          ),
        ],
      ),
    );
  }

  Widget _buildMentorsSection(WidgetRef ref, int currentMentorIndex) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Monthly Mentors',
              style: TextStyleHelper.instance.title20SemiBold,
            ),
            Row(
              children: [
                CustomButton(
                  iconPath: ImageConstant.imgArrowleft,
                  onPressed: () {
                    print('Previous mentor');
                  },
                  width: 36,
                  height: 36,
                ),
                SizedBox(width: 8),
                CustomButton(
                  iconPath: ImageConstant.imgArrowright,
                  onPressed: () {
                    print('Next mentor');
                  },
                  width: 36,
                  height: 36,
                ),
              ],
            ),
          ],
        ),
        SizedBox(height: 16),
        MentorCardWidget(),
        SizedBox(height: 24),
      ],
    );
  }

  Widget _buildUpcomingTaskSection(WidgetRef ref) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Task',
              style: TextStyleHelper.instance.title20SemiBold,
            ),
            Row(
              children: [
                CustomButton(
                  iconPath: ImageConstant.imgArrowleft,
                  onPressed: () {
                    print('Previous task');
                  },
                  width: 36,
                  height: 36,
                ),
                SizedBox(width: 8),
                CustomButton(
                  iconPath: ImageConstant.imgArrowright,
                  onPressed: () {
                    print('Next task');
                  },
                  width: 36,
                  height: 36,
                ),
              ],
            ),
          ],
        ),
        SizedBox(height: 16),
        TaskCardWidget(),
        SizedBox(height: 24),
      ],
    );
  }
}