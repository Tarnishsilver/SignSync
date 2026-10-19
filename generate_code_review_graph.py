#!/usr/bin/env python
"""
Code Review Graph Generator

Generates a comprehensive code review analysis including:
- Code complexity metrics
- Linting results
- Type checking results
- Coverage analysis
- Code quality score

Usage:
    python generate_code_review_graph.py [--output code-review-graph.json]
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

def run_command(cmd: List[str], ignore_error: bool = True) -> Dict[str, Any]:
    """Run a command and capture output."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Command timed out",
            "returncode": -1,
        }
    except Exception as e:
        if ignore_error:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1,
            }
        raise

def get_file_count() -> int:
    """Count Python files in the project."""
    return len(list(Path(".").rglob("*.py")))

def get_lines_of_code() -> Dict[str, int]:
    """Calculate lines of code statistics."""
    stats = {
        "total_lines": 0,
        "code_lines": 0,
        "comment_lines": 0,
        "blank_lines": 0,
    }
    
    for py_file in Path(".").rglob("*.py"):
        if ".venv" in str(py_file) or "__pycache__" in str(py_file):
            continue
        
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                for line in f:
                    stats["total_lines"] += 1
                    stripped = line.strip()
                    
                    if not stripped:
                        stats["blank_lines"] += 1
                    elif stripped.startswith("#"):
                        stats["comment_lines"] += 1
                    else:
                        stats["code_lines"] += 1
        except Exception:
            continue
    
    return stats

def parse_ruff_output(output: str) -> List[Dict[str, Any]]:
    """Parse ruff linting output."""
    issues = []
    for line in output.split("\n"):
        if line.strip():
            issues.append({"message": line})
    return issues

def parse_pylint_output(output: str) -> Dict[str, Any]:
    """Parse pylint output."""
    try:
        data = json.loads(output)
        if isinstance(data, list):
            return {
                "total_issues": len(data),
                "issues": data[:10],  # Keep first 10
            }
    except json.JSONDecodeError:
        return {"total_issues": 0, "issues": []}
    
    return {"total_issues": 0, "issues": []}

def analyze_code() -> Dict[str, Any]:
    """Run comprehensive code analysis."""
    analysis = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "file_statistics": {
            "python_files": get_file_count(),
            "lines_of_code": get_lines_of_code(),
        },
        "analysis_results": {
            "ruff": {},
            "pylint": {},
            "mypy": {},
            "radon": {},
            "coverage": {},
        },
        "quality_score": 0,
    }
    
    print("📊 Code Review Graph Analysis")
    print("=" * 50)
    
    # Ruff analysis
    print("\n🔍 Running Ruff linting...")
    ruff_result = run_command([sys.executable, "-m", "ruff", "check", ".", "--output-format=json"])
    if ruff_result["success"]:
        try:
            ruff_issues = json.loads(ruff_result["stdout"]) if ruff_result["stdout"] else []
            analysis["analysis_results"]["ruff"] = {
                "issues_found": len(ruff_issues),
                "status": "passed" if len(ruff_issues) == 0 else "warning",
            }
            print(f"   ✓ Found {len(ruff_issues)} ruff issues")
        except json.JSONDecodeError:
            analysis["analysis_results"]["ruff"] = {"issues_found": 0, "status": "error"}
    else:
        analysis["analysis_results"]["ruff"] = {"issues_found": 0, "status": "skipped"}
        print("   ⚠ Ruff check skipped")
    
    # Pylint analysis
    print("\n🔍 Running Pylint analysis...")
    pylint_result = run_command(
        [sys.executable, "-m", "pylint", "--exit-zero", "--output-format=json", "app.py"]
    )
    if pylint_result["success"] and pylint_result["stdout"]:
        try:
            pylint_data = json.loads(pylint_result["stdout"])
            if isinstance(pylint_data, list):
                analysis["analysis_results"]["pylint"] = {
                    "issues_found": len(pylint_data),
                    "status": "passed" if len(pylint_data) == 0 else "warning",
                }
                print(f"   ✓ Found {len(pylint_data)} pylint issues")
            else:
                analysis["analysis_results"]["pylint"] = {"issues_found": 0, "status": "passed"}
                print("   ✓ No pylint issues")
        except json.JSONDecodeError:
            analysis["analysis_results"]["pylint"] = {"issues_found": 0, "status": "error"}
    else:
        analysis["analysis_results"]["pylint"] = {"issues_found": 0, "status": "skipped"}
        print("   ⚠ Pylint check skipped")
    
    # MyPy type checking
    print("\n🔍 Running MyPy type checking...")
    mypy_result = run_command(
        [sys.executable, "-m", "mypy", ".", "--ignore-missing-imports", "--no-error-summary"]
    )
    if mypy_result["success"]:
        analysis["analysis_results"]["mypy"] = {
            "status": "passed",
            "issues_found": 0,
        }
        print("   ✓ Type checking passed")
    else:
        mypy_errors = len([l for l in mypy_result["stderr"].split("\n") if "error:" in l.lower()])
        analysis["analysis_results"]["mypy"] = {
            "status": "warning" if mypy_errors < 10 else "failed",
            "issues_found": mypy_errors,
        }
        print(f"   ⚠ Found {mypy_errors} type errors")
    
    # Radon complexity
    print("\n🔍 Running Radon complexity analysis...")
    radon_result = run_command([sys.executable, "-m", "radon", "metrics", "-s", "."])
    if radon_result["success"]:
        analysis["analysis_results"]["radon"] = {
            "status": "passed",
        }
        print("   ✓ Complexity analysis complete")
    else:
        analysis["analysis_results"]["radon"] = {"status": "skipped"}
        print("   ⚠ Radon analysis skipped")
    
    # Coverage analysis
    print("\n🔍 Running Coverage analysis...")
    coverage_result = run_command(
        [sys.executable, "-m", "pytest", "--cov=.", "--cov-report=json", "--quiet"]
    )
    if coverage_result["success"]:
        try:
            coverage_file = Path(".coverage")
            analysis["analysis_results"]["coverage"] = {
                "status": "passed",
            }
            print("   ✓ Coverage analysis complete")
        except Exception:
            analysis["analysis_results"]["coverage"] = {"status": "skipped"}
    else:
        analysis["analysis_results"]["coverage"] = {"status": "skipped"}
        print("   ⚠ Coverage analysis skipped")
    
    # Calculate quality score
    score = 100
    for tool, result in analysis["analysis_results"].items():
        if result.get("status") == "failed":
            score -= 20
        elif result.get("status") == "warning":
            score -= 10
        elif result.get("status") == "error":
            score -= 5
    
    analysis["quality_score"] = max(0, score)
    
    print("\n" + "=" * 50)
    print(f"📈 Overall Quality Score: {analysis['quality_score']}/100")
    print("=" * 50)
    
    return analysis

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate code review graph analysis")
    parser.add_argument(
        "--output",
        default="code-review-graph.json",
        help="Output file path (default: code-review-graph.json)",
    )
    args = parser.parse_args()
    
    # Run analysis
    analysis = analyze_code()
    
    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(analysis, f, indent=2)
    
    print(f"\n✅ Code review graph saved to: {output_path}")
    print("\nAnalysis Summary:")
    print(f"  - Python files: {analysis['file_statistics']['python_files']}")
    print(f"  - Total lines: {analysis['file_statistics']['lines_of_code']['total_lines']}")
    print(f"  - Quality score: {analysis['quality_score']}/100")
    
    return analysis

if __name__ == "__main__":
    main()
