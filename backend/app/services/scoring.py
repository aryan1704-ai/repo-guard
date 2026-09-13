def calculate_score(
    total_findings: int,
    critical: int = 0,
    high: int = 0,
    medium: int = 0,
    low: int = 0
):
    """
    Calculate a security score from 0 to 100.

    Higher severity findings reduce the score more.
    """

    penalty = (
        critical * 25
        + high * 15
        + medium * 7
        + low * 2
    )

    score = 100 - penalty

    # Keep score between 0 and 100
    score = max(0, min(100, score))

    return score


def get_risk_level(score: int):

    if score >= 90:
        return "LOW"

    if score >= 75:
        return "MEDIUM"

    if score >= 50:
        return "HIGH"

    return "CRITICAL"


def calculate_overall_score(
    security_score: int,
    dependency_score: int,
    secret_score: int,
    cicd_score: int,
    health_score: int
):
    """
    Calculate the final RepoGuard score.

    Weights:
    Security       35%
    Dependency     20%
    Secrets        20%
    CI/CD          15%
    Code Health    10%
    """

    overall = (
        security_score * 0.35
        + dependency_score * 0.20
        + secret_score * 0.20
        + cicd_score * 0.15
        + health_score * 0.10
    )

    return round(overall)


def calculate_finding_counts(findings):

    counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0
    }

    for finding in findings:

        severity = finding.get(
            "severity",
            ""
        ).lower()

        if severity in counts:
            counts[severity] += 1

    return counts