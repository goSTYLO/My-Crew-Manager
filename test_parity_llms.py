"""
Parity Test Suite for Model 1 and Model 2
Tests parity-mode llms functions against known fixtures from Step 7 inference exports.

NOTE: For full integration tests with actual LLM inference, configure PEFT_ADAPTER_PATH
environment variables. This suite validates function contracts and error handling.
"""

import sys
import json
import os
from pathlib import Path

sys.path.insert(0, str(Path('AI')))

# Check if models are configured
MODELS_CONFIGURED = os.getenv("PEFT_ADAPTER_PATH") is not None and os.getenv("PEFT_ADAPTER_PATH_BACKLOG") is not None

if MODELS_CONFIGURED:
    from llms.project_llm import parity_generate_overview
    from llms.backlog_llm import parity_generate_backlog
    from llms.models import ProjectModel, BacklogModel
else:
    # Provide mock implementations for testing without models
    ProjectModel = None
    BacklogModel = None

# ===================================================================================================
# MODEL 1 TEST FIXTURES
# ===================================================================================================

M1_FIXTURE_6_SAFESCHOOL = {
    "fixture_id": "M1-6",
    "name": "SafeSchool Campus Safety",
    "proposal": """Develop SafeSchool, a web-based system for campus safety. It will include entrance monitoring, activity detection, and emergency alerts. Success will be measured by improved response times, reduced incidents, and stable deployment.""",
    "expected_status": "FAIL",
    "expected_reason": "goals_count_issue",
    "description": "Should fail parity gates: Model generates only 3 goals instead of required 5",
}

M1_FIXTURE_10_CITYCOMM = {
    "fixture_id": "M1-10",
    "name": "CityComm Resident Services",
    "proposal": """Develop CityComm, a web-based system that connects residents with city services. It will include issue reporting, service access, and AI categorization. Success will be measured by improved response times, resident adoption, and stable deployment.""",
    "expected_status": "PASS",
    "expected_reason": "all_gates_met",
    "description": "Should pass all parity gates: 5 goals with verbs, 4 weeks, all 3 default roles",
}

# ===================================================================================================
# MODEL 2 TEST FIXTURES
# ===================================================================================================

M2_FIXTURE_6_FARMLINK = {
    "fixture_id": "M2-6",
    "name": "FarmLink Cooperative Platform",
    "part1_json": """{
    "title": "FarmLink Cooperative Platform",
    "summary": "FarmLink is a cooperative platform that connects farmers to share resources, sell produce, and access training. It integrates AI to forecast demand and optimize distribution. The system aims to strengthen farming communities and improve profitability.",
    "roles": [
        "Project Manager",
        "Backend Developer",
        "Frontend Developer",
        "AI Engineer",
        "Community Manager",
        "QA Engineer"
    ],
    "features": [
        "Resource Sharing",
        "Produce Marketplace",
        "AI Demand Forecasting",
        "Training Modules"
    ],
    "goals": [
        "Design resource sharing system",
        "Implement marketplace",
        "Enable AI demand forecasting",
        "Develop training modules",
        "Test cooperative platform"
    ]
}""",
    "expected_status": "PASS",
    "expected_reason": "hierarchy_valid",
    "description": "Should pass: 5 epics (matching 5 goals), 1:1:2 hierarchy, proper markers",
}

# ===================================================================================================
# TEST RUNNER
# ===================================================================================================

def test_function_signatures():
    """Validate that parity functions exist and have correct signatures."""
    print("\n" + "=" * 100)
    print("FUNCTION SIGNATURE VALIDATION")
    print("=" * 100)
    
    results = []
    
    # Check project_llm parity function
    try:
        from llms.project_llm import parity_generate_overview
        import inspect
        sig = inspect.signature(parity_generate_overview)
        params = list(sig.parameters.keys())
        
        if "proposal_text" in params:
            print("\n✓ parity_generate_overview() exists with correct signature")
            print(f"  Parameters: {params}")
            results.append({"test": "parity_generate_overview", "status": "PASS"})
        else:
            print("\n✗ parity_generate_overview() has incorrect parameters")
            results.append({"test": "parity_generate_overview", "status": "FAIL", "reason": "wrong parameters"})
    except ImportError as e:
        print(f"\n✗ Failed to import parity_generate_overview: {e}")
        results.append({"test": "parity_generate_overview", "status": "FAIL", "reason": str(e)})
    
    # Check backlog_llm parity function
    try:
        from llms.backlog_llm import parity_generate_backlog
        import inspect
        sig = inspect.signature(parity_generate_backlog)
        params = list(sig.parameters.keys())
        
        if "part1_json" in params:
            print("\n✓ parity_generate_backlog() exists with correct signature")
            print(f"  Parameters: {params}")
            results.append({"test": "parity_generate_backlog", "status": "PASS"})
        else:
            print("\n✗ parity_generate_backlog() has incorrect parameters")
            results.append({"test": "parity_generate_backlog", "status": "FAIL", "reason": "wrong parameters"})
    except ImportError as e:
        print(f"\n✗ Failed to import parity_generate_backlog: {e}")
        results.append({"test": "parity_generate_backlog", "status": "FAIL", "reason": str(e)})
    
    return results


def test_model1_parity():
    """Test Model 1 parity against fixtures (requires LLM configured)."""
    if not MODELS_CONFIGURED:
        print("\n" + "=" * 100)
        print("MODEL 1 PARITY TESTS (SKIPPED - Models not configured)")
        print("=" * 100)
        print("\nTo enable these tests, set environment variables:")
        print("  - PEFT_ADAPTER_PATH=<path-to-model1-adapter>")
        print("  - PEFT_ADAPTER_PATH_BACKLOG=<path-to-model2-adapter>")
        print("  - STRICT_ADAPTER_LOADING=false (to allow fallback loading)")
        return []
    
    print("\n" + "=" * 100)
    print("MODEL 1 PARITY TESTS")
    print("=" * 100)
    
    results = []
    
    # Test M1-6: Should FAIL
    print(f"\nTest: {M1_FIXTURE_6_SAFESCHOOL['fixture_id']} ({M1_FIXTURE_6_SAFESCHOOL['name']})")
    print(f"Expected: {M1_FIXTURE_6_SAFESCHOOL['expected_status']}")
    print("-" * 100)
    
    try:
        model = parity_generate_overview(M1_FIXTURE_6_SAFESCHOOL['proposal'])
        # If we get here, the gate should have failed but didn't
        print("[!] Expected ValueError but function returned ProjectModel")
        results.append({
            "fixture_id": M1_FIXTURE_6_SAFESCHOOL['fixture_id'],
            "test_result": "FAIL",
            "reason": "Expected ValueError but succeeded",
            "goals_count": len(model.goals) if model else 0,
        })
    except ValueError as e:
        error_msg = str(e)
        if "goals_count" in error_msg.lower():
            print(f"[OK] Correctly rejected with goals count error")
            print(f"     Error: {error_msg}")
            results.append({
                "fixture_id": M1_FIXTURE_6_SAFESCHOOL['fixture_id'],
                "test_result": "PASS",
                "reason": "Correctly rejected on goals_count_issue",
            })
        else:
            print(f"[OK] Correctly rejected: {error_msg}")
            results.append({
                "fixture_id": M1_FIXTURE_6_SAFESCHOOL['fixture_id'],
                "test_result": "PASS",
                "reason": f"Correctly rejected: {error_msg[:50]}...",
            })
    except Exception as e:
        print(f"[!] Unexpected exception: {type(e).__name__}: {e}")
        results.append({
            "fixture_id": M1_FIXTURE_6_SAFESCHOOL['fixture_id'],
            "test_result": "FAIL",
            "reason": f"Unexpected exception: {type(e).__name__}",
        })
    
    # Test M1-10: Should PASS
    print(f"\nTest: {M1_FIXTURE_10_CITYCOMM['fixture_id']} ({M1_FIXTURE_10_CITYCOMM['name']})")
    print(f"Expected: {M1_FIXTURE_10_CITYCOMM['expected_status']}")
    print("-" * 100)
    
    try:
        model = parity_generate_overview(M1_FIXTURE_10_CITYCOMM['proposal'])
        
        # Validate model structure
        validation_errors = []
        
        if not model.title:
            validation_errors.append("title is empty")
        if not model.summary:
            validation_errors.append("summary is empty")
        if len(model.roles) == 0:
            validation_errors.append("roles list is empty")
        if len(model.features) == 0:
            validation_errors.append("features list is empty")
        if len(model.goals) != 5:
            validation_errors.append(f"goals count is {len(model.goals)}, expected 5")
        if len(model.timeline) != 4:
            validation_errors.append(f"timeline weeks is {len(model.timeline)}, expected 4")
        
        if validation_errors:
            print(f"[!] Model structure validation failed:")
            for err in validation_errors:
                print(f"    - {err}")
            results.append({
                "fixture_id": M1_FIXTURE_10_CITYCOMM['fixture_id'],
                "test_result": "FAIL",
                "reason": "; ".join(validation_errors),
            })
        else:
            print(f"[OK] Model structure is valid")
            print(f"     Title: {model.title}")
            print(f"     Goals: {len(model.goals)}")
            print(f"     Roles: {len(model.roles)}")
            print(f"     Timeline weeks: {len(model.timeline)}")
            results.append({
                "fixture_id": M1_FIXTURE_10_CITYCOMM['fixture_id'],
                "test_result": "PASS",
                "reason": "All gates passed and model structure valid",
                "goals_count": len(model.goals),
                "timeline_weeks": len(model.timeline),
            })
    
    except ValueError as e:
        print(f"[!] Expected success but got ValueError: {e}")
        results.append({
            "fixture_id": M1_FIXTURE_10_CITYCOMM['fixture_id'],
            "test_result": "FAIL",
            "reason": f"Unexpected ValueError: {str(e)[:80]}",
        })
    except Exception as e:
        print(f"[!] Unexpected exception: {type(e).__name__}: {e}")
        results.append({
            "fixture_id": M1_FIXTURE_10_CITYCOMM['fixture_id'],
            "test_result": "FAIL",
            "reason": f"Unexpected exception: {type(e).__name__}",
        })
    
    return results


def test_model2_parity():
    """Test Model 2 parity against fixtures (requires LLM configured)."""
    if not MODELS_CONFIGURED:
        return []
    
    print("\n" + "=" * 100)
    print("MODEL 2 PARITY TESTS")
    print("=" * 100)
    
    results = []
    
    # Test M2-6: Should PASS
    print(f"\nTest: {M2_FIXTURE_6_FARMLINK['fixture_id']} ({M2_FIXTURE_6_FARMLINK['name']})")
    print(f"Expected: {M2_FIXTURE_6_FARMLINK['expected_status']}")
    print("-" * 100)
    
    try:
        backlog = parity_generate_backlog(part1_json=M2_FIXTURE_6_FARMLINK['part1_json'])
        
        # Validate backlog structure
        validation_errors = []
        
        if len(backlog.epics) != 5:
            validation_errors.append(f"epic count is {len(backlog.epics)}, expected 5")
        
        for idx, epic in enumerate(backlog.epics, start=1):
            if len(epic.sub_epics) != 1:
                validation_errors.append(f"Epic {idx}: sub-epic count is {len(epic.sub_epics)}, expected 1")
            elif len(epic.sub_epics[0].user_stories) != 1:
                validation_errors.append(f"Epic {idx}, Sub-Epic 1: user story count is {len(epic.sub_epics[0].user_stories)}, expected 1")
            elif len(epic.sub_epics[0].user_stories[0].tasks) != 2:
                validation_errors.append(f"Epic {idx}: task count is {len(epic.sub_epics[0].user_stories[0].tasks)}, expected 2")
        
        if validation_errors:
            print(f"[!] Backlog structure validation failed:")
            for err in validation_errors:
                print(f"    - {err}")
            results.append({
                "fixture_id": M2_FIXTURE_6_FARMLINK['fixture_id'],
                "test_result": "FAIL",
                "reason": "; ".join(validation_errors),
            })
        else:
            print(f"[OK] Backlog structure is valid")
            print(f"     Epics: {len(backlog.epics)}")
            for idx, epic in enumerate(backlog.epics, start=1):
                sub_count = len(epic.sub_epics)
                story_count = sum(len(s.user_stories) for s in epic.sub_epics)
                task_count = sum(len(t.tasks) for s in epic.sub_epics for t in s.user_stories)
                print(f"     Epic {idx}: {sub_count} sub-epic(s), {story_count} story(ies), {task_count} task(s)")
            results.append({
                "fixture_id": M2_FIXTURE_6_FARMLINK['fixture_id'],
                "test_result": "PASS",
                "reason": "All gates passed and backlog structure valid",
                "epic_count": len(backlog.epics),
            })
    
    except ValueError as e:
        print(f"[!] Expected success but got ValueError: {e}")
        results.append({
            "fixture_id": M2_FIXTURE_6_FARMLINK['fixture_id'],
            "test_result": "FAIL",
            "reason": f"Unexpected ValueError: {str(e)[:80]}",
        })
    except Exception as e:
        print(f"[!] Unexpected exception: {type(e).__name__}: {e}")
        results.append({
            "fixture_id": M2_FIXTURE_6_FARMLINK['fixture_id'],
            "test_result": "FAIL",
            "reason": f"Unexpected exception: {type(e).__name__}",
        })
    
    return results


def print_summary(sig_results, m1_results, m2_results):
    """Print test summary."""
    print("\n" + "=" * 100)
    print("PARITY TEST SUMMARY")
    print("=" * 100)
    
    all_results = sig_results + m1_results + m2_results
    passed = sum(1 for r in all_results if r.get('status') == 'PASS' or r.get('test_result') == 'PASS')
    failed = sum(1 for r in all_results if r.get('status') == 'FAIL' or r.get('test_result') == 'FAIL')
    
    print(f"\nTotal Tests: {len(all_results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if not MODELS_CONFIGURED:
        print("\n[NOTE] Full inference tests skipped (models not configured)")
        print("To enable: PEFT_ADAPTER_PATH=<path> PEFT_ADAPTER_PATH_BACKLOG=<path> STRICT_ADAPTER_LOADING=false")
    
    if failed == 0:
        print("\n[SUCCESS] All parity tests passed!")
    else:
        print("\n[WARNING] Some tests failed:")
        for result in all_results:
            if result.get('test_result') == 'FAIL' or result.get('status') == 'FAIL':
                fixture_id = result.get('fixture_id', result.get('test', 'unknown'))
                reason = result.get('reason', 'unknown')
                print(f"   - {fixture_id}: {reason}")
    
    # Print detailed results table
    print("\n" + "-" * 100)
    print(f"{'Test/Fixture':<20} {'Status':<10} {'Reason':<70}")
    print("-" * 100)
    for result in all_results:
        fixture_id = result.get('fixture_id', result.get('test', 'unknown'))
        status = result.get('test_result', result.get('status', 'unknown'))
        reason = result.get('reason', '')[:67] + "..." if len(result.get('reason', '')) > 70 else result.get('reason', '')
        status_display = "PASS" if status == 'PASS' else "FAIL"
        print(f"{fixture_id:<20} {status_display:<10} {reason:<70}")
    print("-" * 100)
    
    return passed, failed


if __name__ == "__main__":
    print("\n" + "=" * 100)
    print("PARITY TEST SUITE FOR LLMS")
    print("=" * 100)
    
    sig_results = test_function_signatures()
    m1_results = test_model1_parity()
    m2_results = test_model2_parity()
    
    passed, failed = print_summary(sig_results, m1_results, m2_results)
    
    sys.exit(0 if failed == 0 else 1)

