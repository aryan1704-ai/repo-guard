from typing import Any


def build_ai_analysis_data(
    scan: Any,
    security_findings: list,
    dependencies: list,
    secrets: list,
    cicd_findings: list,
    health: Any
) -> dict:
    """
    Prepare structured scan data for the AI layer.

    The AI receives only findings produced by RepoGuard.
    It should not invent new vulnerabilities.
    """

    return {
        "scan": {
            "overall_score": scan.overall_score,
            "security_score": scan.security_score,
            "dependency_score": scan.dependency_score,
            "secret_score": scan.secret_score,
            "cicd_score": scan.cicd_score,
            "health_score": scan.health_score,
        },

        "security_findings": [
            format_security_finding(finding)
            for finding in security_findings
        ],

        "dependencies": [
            format_dependency(dependency)
            for dependency in dependencies
        ],

        "secrets": [
            format_secret(secret)
            for secret in secrets
        ],

        "cicd_findings": [
            format_cicd_finding(finding)
            for finding in cicd_findings
        ],

        "code_health": format_health(health),
    }


def format_security_finding(finding: Any) -> dict:
    return {
        "category": finding.category,
        "severity": finding.severity,
        "title": finding.title,
        "description": finding.description,
        "file_path": finding.file_path,
        "line_number": finding.line_number,
        "rule_id": finding.rule_id,
        "recommendation": finding.recommendation,
    }


def format_dependency(dependency: Any) -> dict:
    return {
        "name": dependency.name,
        "version": dependency.version,
        "ecosystem": dependency.ecosystem,
        "vulnerability_count": dependency.vulnerability_count,
    }


def format_secret(secret: Any) -> dict:
    return {
        "secret_type": secret.secret_type,
        "file_path": secret.file_path,
        "line_number": secret.line_number,
        "severity": secret.severity,
        "description": secret.description,
    }


def format_cicd_finding(finding: Any) -> dict:
    return {
        "severity": finding.severity,
        "title": finding.title,
        "description": finding.description,
        "file_path": finding.file_path,
        "line_number": finding.line_number,
        "rule_id": finding.rule_id,
        "recommendation": finding.recommendation,
    }


def format_health(health: Any) -> dict | None:

    if health is None:
        return None

    return {
        "total_files": health.total_files,
        "code_files": health.code_files,
        "total_lines": health.total_lines,
        "readme_found": health.readme_found,
        "test_files": health.test_files,
        "dependency_files": health.dependency_files,
        "todo_count": health.todo_count,
        "large_files": health.large_files,
    }


def build_ai_prompt(analysis_data: dict) -> str:
    """
    Build a grounded prompt for the AI provider.

    The model must explain existing RepoGuard findings
    and must not create unsupported vulnerabilities.
    """

    return f"""
You are the security analysis assistant for RepoGuard.

RepoGuard is a GitHub repository security and health analyzer.

IMPORTANT RULES:

1. Use ONLY the findings and metrics provided below.
2. Do NOT invent vulnerabilities.
3. Do NOT claim that a vulnerability exists unless it
   appears in the supplied scan data.
4. Clearly distinguish detected issues from recommendations.
5. If there are no findings in a category, say so.
6. Do not expose secret values.
7. Give practical remediation advice.
8. Keep the explanation understandable for developers.

Return the report using these sections:

1. Executive Summary
2. Overall Risk
3. Top Security Risks
4. Dependency Risks
5. Secret Detection Summary
6. CI/CD Security
7. Code Health
8. Recommended Actions

SCAN DATA:

{analysis_data}
"""