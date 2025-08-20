import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

import '../../../core/app_export.dart';

class CompanyDropdownWidget extends StatefulWidget {
  final String? selectedCompany;
  final Function(String?) onCompanySelected;
  final String? errorText;

  const CompanyDropdownWidget({
    Key? key,
    this.selectedCompany,
    required this.onCompanySelected,
    this.errorText,
  }) : super(key: key);

  @override
  State<CompanyDropdownWidget> createState() => _CompanyDropdownWidgetState();
}

class _CompanyDropdownWidgetState extends State<CompanyDropdownWidget> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _showSuggestions = false;
  List<String> _filteredCompanies = [];

  final List<String> _companies = [
    'ABC Construction Ltd.',
    'Stellar Film Productions',
    'Maritime Solutions Inc.',
    'SkyHigh Aviation Services',
    'Grand Hotel Management',
    'Elite Event Planners',
    'BuildRight Construction',
    'Creative Media Studios',
    'Ocean Freight Services',
    'AirLink Airlines',
    'Luxury Hospitality Group',
    'Premier Event Solutions',
    'Urban Development Corp.',
    'Silver Screen Productions',
    'Coastal Shipping Co.',
    'Wings Aviation Group',
    'Boutique Hotels International',
    'Signature Events LLC',
    'Metro Construction Services',
    'Independent Film Collective',
  ];

  @override
  void initState() {
    super.initState();
    _controller.text = widget.selectedCompany ?? '';
    _filteredCompanies = _companies;

    _controller.addListener(_onTextChanged);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onTextChanged);
    _focusNode.removeListener(_onFocusChanged);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final query = _controller.text.toLowerCase();
    setState(() {
      _filteredCompanies = _companies
          .where((company) => company.toLowerCase().contains(query))
          .toList();
      _showSuggestions = query.isNotEmpty && _focusNode.hasFocus;
    });
    widget
        .onCompanySelected(_controller.text.isEmpty ? null : _controller.text);
  }

  void _onFocusChanged() {
    setState(() {
      _showSuggestions = _focusNode.hasFocus && _controller.text.isNotEmpty;
    });
  }

  void _selectCompany(String company) {
    _controller.text = company;
    widget.onCompanySelected(company);
    setState(() {
      _showSuggestions = false;
    });
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8.0),
            border: Border.all(
              color: widget.errorText != null
                  ? AppTheme.lightTheme.colorScheme.error
                  : _focusNode.hasFocus
                      ? AppTheme.lightTheme.colorScheme.primary
                      : AppTheme.lightTheme.colorScheme.outline,
              width: _focusNode.hasFocus ? 2.0 : 1.0,
            ),
          ),
          child: TextFormField(
            controller: _controller,
            focusNode: _focusNode,
            decoration: InputDecoration(
              labelText: 'Company/Organization',
              hintText: 'Enter or select your company',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: 4.w, vertical: 3.h),
              suffixIcon: Padding(
                padding: EdgeInsets.only(right: 3.w),
                child: CustomIconWidget(
                  iconName: _showSuggestions
                      ? 'keyboard_arrow_up'
                      : 'keyboard_arrow_down',
                  color: AppTheme.lightTheme.colorScheme.onSurfaceVariant,
                  size: 6.w,
                ),
              ),
            ),
            style: AppTheme.lightTheme.textTheme.bodyLarge,
          ),
        ),
        if (widget.errorText != null) ...[
          SizedBox(height: 0.5.h),
          Padding(
            padding: EdgeInsets.only(left: 4.w),
            child: Text(
              widget.errorText!,
              style: AppTheme.lightTheme.textTheme.bodySmall?.copyWith(
                color: AppTheme.lightTheme.colorScheme.error,
              ),
            ),
          ),
        ],
        if (_showSuggestions && _filteredCompanies.isNotEmpty) ...[
          SizedBox(height: 0.5.h),
          Container(
            constraints: BoxConstraints(maxHeight: 30.h),
            decoration: BoxDecoration(
              color: AppTheme.lightTheme.colorScheme.surface,
              borderRadius: BorderRadius.circular(8.0),
              border: Border.all(
                color: AppTheme.lightTheme.colorScheme.outline,
                width: 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.lightTheme.colorScheme.shadow,
                  blurRadius: 8.0,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _filteredCompanies.length,
              itemBuilder: (context, index) {
                final company = _filteredCompanies[index];
                return InkWell(
                  onTap: () => _selectCompany(company),
                  child: Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      border: index < _filteredCompanies.length - 1
                          ? Border(
                              bottom: BorderSide(
                                color: AppTheme.lightTheme.colorScheme.outline
                                    .withValues(alpha: 0.3),
                                width: 0.5,
                              ),
                            )
                          : null,
                    ),
                    child: Row(
                      children: [
                        CustomIconWidget(
                          iconName: 'business',
                          color: AppTheme.lightTheme.colorScheme.primary,
                          size: 5.w,
                        ),
                        SizedBox(width: 3.w),
                        Expanded(
                          child: Text(
                            company,
                            style: AppTheme.lightTheme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}
