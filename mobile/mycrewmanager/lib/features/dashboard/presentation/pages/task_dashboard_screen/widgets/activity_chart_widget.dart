import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class ActivityChartWidget extends StatelessWidget {
  const ActivityChartWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // Artificial data for the chart
    final List<FlSpot> spots = [
      FlSpot(0, 1),
      FlSpot(1, 2),
      FlSpot(2, 1.5),
      FlSpot(3, 3),
      FlSpot(4, 2.2),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7FA),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              const Text(
                'Activity',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: Color(0xFF181929),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Text(
                      'This Week',
                      style: TextStyle(
                        color: Color(0xFF181929),
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                    const Icon(Icons.keyboard_arrow_down, size: 18, color: Color(0xFF181929)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Chart
          SizedBox(
            height: 120,
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: LineChart(
                    LineChartData(
                      minY: 1,
                      maxY: 3.2,
                      minX: 0,
                      maxX: 4,
                      gridData: FlGridData(
                        show: false,
                      ),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 28,
                            getTitlesWidget: (value, meta) {
                              if (value == 1 || value == 2 || value == 3) {
                                return Text(
                                  value.toInt().toString(),
                                  style: const TextStyle(
                                    color: Color(0xFF181929),
                                    fontSize: 13,
                                  ),
                                  textAlign: TextAlign.center,
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              switch (value.toInt()) {
                                case 0:
                                  return const Text('S', style: TextStyle(color: Color(0xFF181929), fontSize: 13));
                                case 1:
                                  return const Text('M', style: TextStyle(color: Color(0xFF181929), fontSize: 13));
                                case 2:
                                  return const Text('T', style: TextStyle(color: Color(0xFF181929), fontSize: 13));
                                case 3:
                                  return const Text('W', style: TextStyle(color: Color(0xFF181929), fontSize: 13));
                                case 4:
                                  return const Text('T', style: TextStyle(color: Color(0xFF181929), fontSize: 13));
                                default:
                                  return const SizedBox.shrink();
                              }
                            },
                          ),
                        ),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: spots,
                          isCurved: true,
                          color: const Color(0xFF181929),
                          barWidth: 3,
                          dotData: FlDotData(
                            show: true,
                            checkToShowDot: (spot, barData) => spot.x == 1,
                            getDotPainter: (spot, percent, barData, index) {
                              return FlDotCirclePainter(
                                radius: 8,
                                color: const Color(0xFF5B6EFF),
                                strokeWidth: 0,
                                strokeColor: Colors.transparent,
                              );
                            },
                          ),
                          belowBarData: BarAreaData(
                            show: true,
                            color: const Color(0xFF5B6EFF).withOpacity(0.08),
                          ),
                        ),
                      ],
                      lineTouchData: LineTouchData(
                        enabled: false,
                      ),
                    ),
                  ),
                ),
                // Tooltip for Monday
                Positioned(
                  left: 36,
                  top: 16,
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF181929),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '3 Task',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: Color(0xFF5B6EFF), width: 3),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}