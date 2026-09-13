import json
import os
import subprocess


def scan_secrets(repository_path: str):
    """
    Scan a repository using Gitleaks.
    Returns structured secret findings.
    """

    report_file = os.path.join(
        repository_path,
        "gitleaks-report.json"
    )

    command = [
        "gitleaks",
        "detect",
        "--source",
        repository_path,
        "--report-format",
        "json",
        "--report-path",
        report_file,
        "--no-banner"
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120
        )

    except FileNotFoundError:
        return {
            "status": "error",
            "message": "Gitleaks is not installed or not available in PATH",
            "findings": []
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "message": "Gitleaks scan timed out",
            "findings": []
        }

    findings = []

    # Gitleaks returns exit code 1 when secrets are found.
    # Therefore, exit code 1 is NOT treated as a scanner failure.

    if os.path.exists(report_file):

        try:
            with open(
                report_file,
                "r",
                encoding="utf-8"
            ) as file:

                data = json.load(file)

            for finding in data:

                findings.append({
                    "secret_type": finding.get(
                        "RuleID",
                        "Unknown Secret"
                    ),

                    "file_path": finding.get(
                        "File",
                        "Unknown"
                    ),

                    "line_number": finding.get(
                        "StartLine"
                    ),

                    "severity": "HIGH",

                    "description": finding.get(
                        "Description",
                        "Potential exposed secret detected"
                    )
                })

        except (
            OSError,
            json.JSONDecodeError
        ):
            pass

    # Never keep the raw Gitleaks report.
    try:
        if os.path.exists(report_file):
            os.remove(report_file)
    except OSError:
        pass

    return {
        "status": "success",
        "message": "Secret scan completed",
        "findings": findings
    }