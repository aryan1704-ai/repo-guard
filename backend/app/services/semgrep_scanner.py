import json
import os
import subprocess
import tempfile


def scan_with_semgrep(repository_path: str):
    report_file = tempfile.NamedTemporaryFile(
        suffix=".json",
        delete=False
    ).name

    command = [
        "semgrep",
        "--config", "auto",
        "--json",
        "--output", report_file,
        repository_path
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=180
        )

        if not os.path.exists(report_file):
            return {
                "status": "error",
                "message": "Semgrep did not generate a report",
                "findings": []
            }

        with open(report_file, "r", encoding="utf-8") as file:
            data = json.load(file)

        findings = []

        for result_item in data.get("results", []):
            extra = result_item.get("extra", {})

            metadata = extra.get("metadata", {})
            severity = metadata.get("severity", "WARNING").upper()

            if severity == "ERROR":
                severity = "HIGH"
            elif severity == "WARNING":
                severity = "MEDIUM"
            elif severity == "INFO":
                severity = "LOW"

            findings.append({
                "category": "STATIC_ANALYSIS",
                "severity": severity,
                "title": extra.get(
                    "message",
                    result_item.get("check_id", "Static security issue")
                ),
                "description": extra.get(
                    "message",
                    "Potential security issue detected by Semgrep."
                ),
                "file_path": result_item.get("path"),
                "line_number": result_item.get("start", {}).get("line"),
                "rule_id": result_item.get("check_id"),
                "recommendation": metadata.get(
                    "fix",
                    "Review the affected code and apply the recommended secure coding practice."
                )
            })

        return {
            "status": "success",
            "message": "Semgrep scan completed",
            "findings": findings
        }

    except FileNotFoundError:
        return {
            "status": "error",
            "message": "Semgrep is not installed or not available in PATH",
            "findings": []
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "message": "Semgrep scan timed out",
            "findings": []
        }

    except (OSError, json.JSONDecodeError) as e:
        return {
            "status": "error",
            "message": f"Semgrep scan failed: {str(e)}",
            "findings": []
        }

    finally:
        try:
            if os.path.exists(report_file):
                os.remove(report_file)
        except OSError:
            pass