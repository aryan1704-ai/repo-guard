from app.services.scoring import (
    calculate_score,
    get_risk_level,
    calculate_overall_score,
    calculate_finding_counts
)


findings = [
    {"severity": "CRITICAL"},
    {"severity": "HIGH"},
    {"severity": "HIGH"},
    {"severity": "MEDIUM"},
    {"severity": "LOW"}
]


counts = calculate_finding_counts(findings)

print("\nFINDING COUNTS:")
print(counts)


security_score = calculate_score(
    total_findings=len(findings),
    critical=counts["critical"],
    high=counts["high"],
    medium=counts["medium"],
    low=counts["low"]
)

print("\nSECURITY SCORE:")
print(security_score)


risk = get_risk_level(
    security_score
)

print("\nRISK LEVEL:")
print(risk)


overall_score = calculate_overall_score(
    security_score=security_score,
    dependency_score=90,
    secret_score=100,
    cicd_score=85,
    health_score=80
)

print("\nOVERALL SCORE:")
print(overall_score)