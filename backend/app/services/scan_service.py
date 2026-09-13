from datetime import datetime

from app.services.repository_service import (
    clone_repository,
    delete_repository
)

from app.services.code_health import (
    analyze_code_health
)

from app.services.dependency_scanner import (
    scan_dependencies,
    check_vulnerabilities
)

from app.services.secret_scanner import (
    scan_secrets
)

from app.services.cicd_scanner import (
    scan_cicd
)

from app.services.semgrep_scanner import (
    scan_with_semgrep
)

from app.services.scoring import (
    calculate_score,
    calculate_overall_score,
    calculate_finding_counts
)

from app.models.security_finding import (
    SecurityFinding
)

from app.models.secret_finding import (
    SecretFinding
)

from app.models.health_metric import (
    HealthMetric
)

from app.models.dependency import (
    Dependency
)


# ==========================================================
# BACKGROUND SCAN
# ==========================================================

def run_scan_background(scan_id: int):

    from app.core.database import SessionLocal
    from app.models.scan import Scan
    from app.models.repository import Repository

    db = SessionLocal()

    try:

        scan = db.query(Scan).filter(
            Scan.id == scan_id
        ).first()

        if not scan:
            print(f"Scan {scan_id} not found")
            return

        repository = db.query(Repository).filter(
            Repository.id == scan.repository_id
        ).first()

        if not repository:

            scan.status = "FAILED"
            db.commit()

            print(
                f"Repository for scan {scan_id} not found"
            )

            return

        scan.status = "RUNNING"
        scan.progress = 5
        db.commit()

        print(
            f"Starting scan {scan_id}: "
            f"{repository.github_url}"
        )

        run_scan(
            repository.github_url,
            db,
            scan
        )

    except Exception as e:

        print(
            f"Scan {scan_id} failed: {e}"
        )

        scan = db.query(Scan).filter(
            Scan.id == scan_id
        ).first()

        if scan:

            scan.status = "FAILED"
            db.commit()

    finally:

        db.close()


# ==========================================================
# MAIN SCAN FUNCTION
# ==========================================================

def run_scan(
    repository_url: str,
    db,
    scan
):

    temp_folder = None

    try:

        # ==================================================
        # 1. REPOSITORY ACQUISITION
        # ==================================================

        print(
            f"Scan {scan.id}: cloning repository"
        )

        scan.status = "CLONING"
        scan.progress = 10
        db.commit()

        temp_folder = clone_repository(
            repository_url
        )

        print(
            f"Scan {scan.id}: repository cloned"
        )

        # ==================================================
        # 2. CODE HEALTH ANALYSIS
        # ==================================================

        print(
            f"Scan {scan.id}: code health analysis"
        )

        scan.status = "ANALYZING"
        scan.progress = 30
        db.commit()

        health_result = analyze_code_health(
            temp_folder
        )

        scan.progress = 45
        db.commit()

        print(
            f"Scan {scan.id}: code health completed"
        )

        # ==================================================
        # 3. DEPENDENCY ANALYSIS
        # ==================================================

        print(
            f"Scan {scan.id}: dependency analysis"
        )

        dependencies = scan_dependencies(
            temp_folder
        )

        dependency_findings = []

        for dependency in dependencies:

            vulnerability_count = (
                check_vulnerabilities(
                    dependency["name"],
                    dependency.get("version"),
                    dependency["ecosystem"]
                )
            )

            dependency[
                "vulnerability_count"
            ] = vulnerability_count

            if vulnerability_count > 0:

                dependency_findings.append({

                    "category": "DEPENDENCY",

                    "severity": "HIGH",

                    "title": (
                        f"Vulnerable dependency: "
                        f"{dependency['name']}"
                    ),

                    "description": (
                        f"{vulnerability_count} known "
                        f"vulnerability(s) found in "
                        f"{dependency['name']}."
                    ),

                    "recommendation": (
                        "Update the dependency to a "
                        "safe version and review the "
                        "associated security advisories."
                    )
                })

        scan.progress = 60
        db.commit()

        print(
            f"Scan {scan.id}: dependency analysis completed "
            f"({len(dependencies)} dependencies)"
        )

        # ==================================================
        # 4. SECRET DETECTION
        # ==================================================

        print(
            f"Scan {scan.id}: secret detection"
        )

        try:

            secret_result = scan_secrets(
                temp_folder
            )

            secret_findings = secret_result.get(
                "findings",
                []
            )

            if secret_result.get("status") == "error":

                print(
                    f"Secret scanner warning: "
                    f"{secret_result.get('message')}"
                )

        except Exception as e:

            print(
                f"Secret scanner failed, "
                f"continuing scan: {e}"
            )

            secret_findings = []

        scan.progress = 70
        db.commit()

        print(
            f"Scan {scan.id}: secret detection completed "
            f"({len(secret_findings)} findings)"
        )

        # ==================================================
        # 5. CI/CD SECURITY
        # ==================================================

        print(
            f"Scan {scan.id}: CI/CD analysis"
        )

        try:

            cicd_result = scan_cicd(
                temp_folder
            )

            cicd_findings = cicd_result.get(
                "findings",
                []
            )

            if cicd_result.get("status") == "error":

                print(
                    f"CI/CD scanner warning: "
                    f"{cicd_result.get('message')}"
                )

        except Exception as e:

            print(
                f"CI/CD scanner failed, "
                f"continuing scan: {e}"
            )

            cicd_findings = []

        for finding in cicd_findings:

            finding["category"] = "CICD"

        scan.progress = 80
        db.commit()

        print(
            f"Scan {scan.id}: CI/CD analysis completed "
            f"({len(cicd_findings)} findings)"
        )

        # ==================================================
        # 6. SEMGREP STATIC ANALYSIS
        # ==================================================

        print(
            f"Scan {scan.id}: Semgrep analysis"
        )

        try:

            semgrep_result = scan_with_semgrep(
                temp_folder
            )

            semgrep_findings = semgrep_result.get(
                "findings",
                []
            )

            if semgrep_result.get("status") == "error":

                print(
                    f"Semgrep warning: "
                    f"{semgrep_result.get('message')}"
                )

        except Exception as e:

            print(
                f"Semgrep failed, "
                f"continuing scan: {e}"
            )

            semgrep_findings = []

        scan.progress = 85
        db.commit()

        print(
            f"Scan {scan.id}: Semgrep completed "
            f"({len(semgrep_findings)} findings)"
        )

        # ==================================================
        # 7. COMBINE ALL FINDINGS
        # ==================================================

        all_findings = []

        all_findings.extend(
            dependency_findings
        )

        all_findings.extend(
            secret_findings
        )

        all_findings.extend(
            cicd_findings
        )

        all_findings.extend(
            semgrep_findings
        )

        print(
            f"Scan {scan.id}: total findings = "
            f"{len(all_findings)}"
        )

        # ==================================================
        # 8. SAVE SECURITY FINDINGS
        # ==================================================

        for finding in all_findings:

            security_finding = SecurityFinding(

                scan_id=scan.id,

                category=finding.get(
                    "category",
                    "SECURITY"
                ),

                severity=finding.get(
                    "severity",
                    "MEDIUM"
                ),

                title=finding.get(
                    "title",
                    finding.get(
                        "secret_type",
                        finding.get(
                            "rule",
                            "Security finding"
                        )
                    )
                ),

                description=finding.get(
                    "description",
                    "Potential security issue detected."
                ),

                file_path=finding.get(
                    "file_path",
                    finding.get(
                        "workflow"
                    )
                ),

                line_number=finding.get(
                    "line_number"
                ),

                rule_id=finding.get(
                    "rule_id",
                    finding.get(
                        "rule"
                    )
                ),

                recommendation=finding.get(
                    "recommendation"
                )
            )

            db.add(
                security_finding
            )

        # ==================================================
        # 9. SAVE SECRET FINDINGS
        # ==================================================

        for finding in secret_findings:

            secret_finding = SecretFinding(

                scan_id=scan.id,

                secret_type=finding.get(
                    "secret_type",
                    "Unknown Secret"
                ),

                file_path=finding.get(
                    "file_path",
                    "Unknown"
                ),

                line_number=finding.get(
                    "line_number"
                ),

                severity=finding.get(
                    "severity",
                    "HIGH"
                ),

                description=finding.get(
                    "description",
                    "Potential exposed secret detected."
                )
            )

            db.add(
                secret_finding
            )

        # ==================================================
        # 10. CALCULATE FINDING COUNTS
        # ==================================================

        counts = calculate_finding_counts(
            all_findings
        )

        # ==================================================
        # 11. SECURITY SCORE
        # ==================================================

        security_score = calculate_score(

            total_findings=len(
                all_findings
            ),

            critical=counts["critical"],

            high=counts["high"],

            medium=counts["medium"],

            low=counts["low"]
        )

        # ==================================================
        # 12. DEPENDENCY SCORE
        # ==================================================

        total_dependencies = len(
            dependencies
        )

        vulnerable_dependencies = sum(

            1

            for dependency in dependencies

            if dependency.get(
                "vulnerability_count",
                0
            ) > 0
        )

        if total_dependencies == 0:

            dependency_score = 100

        else:

            dependency_score = round(

                100 -

                (
                    vulnerable_dependencies
                    / total_dependencies
                    * 100
                )
            )

        dependency_score = max(
            0,
            min(100, dependency_score)
        )

        # ==================================================
        # 13. SECRET SCORE
        # ==================================================

        secret_counts = (
            calculate_finding_counts(
                secret_findings
            )
        )

        secret_score = calculate_score(

            total_findings=len(
                secret_findings
            ),

            critical=secret_counts[
                "critical"
            ],

            high=secret_counts[
                "high"
            ],

            medium=secret_counts[
                "medium"
            ],

            low=secret_counts[
                "low"
            ]
        )

        # ==================================================
        # 14. CI/CD SCORE
        # ==================================================

        cicd_counts = (
            calculate_finding_counts(
                cicd_findings
            )
        )

        cicd_score = calculate_score(

            total_findings=len(
                cicd_findings
            ),

            critical=cicd_counts[
                "critical"
            ],

            high=cicd_counts[
                "high"
            ],

            medium=cicd_counts[
                "medium"
            ],

            low=cicd_counts[
                "low"
            ]
        )

        # ==================================================
        # 15. CODE HEALTH SCORE
        # ==================================================

        health_score = 100

        if not health_result[
            "readme_found"
        ]:

            health_score -= 10

        if health_result[
            "test_files"
        ] == 0:

            health_score -= 15

        if health_result[
            "dependency_files"
        ] == 0:

            health_score -= 5

        if health_result[
            "large_files"
        ] > 0:

            health_score -= 5

        if health_result[
            "todo_count"
        ] > 20:

            health_score -= 5

        health_score = max(
            0,
            min(100, health_score)
        )

        # ==================================================
        # 16. OVERALL SCORE
        # ==================================================

        overall_score = (
            calculate_overall_score(

                security_score=
                    security_score,

                dependency_score=
                    dependency_score,

                secret_score=
                    secret_score,

                cicd_score=
                    cicd_score,

                health_score=
                    health_score
            )
        )

        # ==================================================
        # 17. SAVE HEALTH METRICS
        # ==================================================

        health_metric = HealthMetric(

            scan_id=scan.id,

            total_files=health_result[
                "total_files"
            ],

            code_files=health_result[
                "code_files"
            ],

            total_lines=health_result[
                "total_lines"
            ],

            readme_found=health_result[
                "readme_found"
            ],

            test_files=health_result[
                "test_files"
            ],

            dependency_files=health_result[
                "dependency_files"
            ],

            todo_count=health_result[
                "todo_count"
            ],

            large_files=health_result[
                "large_files"
            ]
        )

        db.add(
            health_metric
        )

        # ==================================================
        # 18. SAVE DEPENDENCIES
        # ==================================================

        for dependency in dependencies:

            dependency_record = Dependency(

                scan_id=scan.id,

                name=dependency[
                    "name"
                ],

                version=dependency.get(
                    "version"
                ),

                ecosystem=dependency.get(
                    "ecosystem"
                ),

                vulnerability_count=dependency.get(
                    "vulnerability_count",
                    0
                )
            )

            db.add(
                dependency_record
            )

        db.commit()

        # ==================================================
        # 19. SAVE SCORES
        # ==================================================

        scan.security_score = (
            security_score
        )

        scan.dependency_score = (
            dependency_score
        )

        scan.secret_score = (
            secret_score
        )

        scan.cicd_score = (
            cicd_score
        )

        scan.health_score = (
            health_score
        )

        scan.overall_score = (
            overall_score
        )

        scan.progress = 90
        db.commit()

        print(
            f"Scan {scan.id}: results saved"
        )

        # ==================================================
        # 20. COMPLETE SCAN
        # ==================================================

        scan.status = "COMPLETED"

        scan.progress = 100

        scan.completed_at = (
            datetime.utcnow()
        )

        db.commit()

        print(
            f"Scan {scan.id}: COMPLETED "
            f"with score {overall_score}/100"
        )

        # ==================================================
        # 21. RETURN RESULTS
        # ==================================================

        return {

            "status": "success",

            "scan_id": scan.id,

            "security_score":
                security_score,

            "dependency_score":
                dependency_score,

            "secret_score":
                secret_score,

            "cicd_score":
                cicd_score,

            "health_score":
                health_score,

            "overall_score":
                overall_score,

            "findings":
                all_findings,

            "health":
                health_result,

            "dependencies":
                dependencies,

            "secret_findings":
                secret_findings,

            "cicd_findings":
                cicd_findings,

            "semgrep_findings":
                semgrep_findings
        }

    # ======================================================
    # MAIN ERROR HANDLER
    # ======================================================

    except Exception as e:

        print(
            f"Scan {scan.id} failed: {e}"
        )

        scan.status = "FAILED"

        db.commit()

        return {

            "status": "error",

            "message": str(e)
        }

    # ======================================================
    # CLEANUP
    # ======================================================

    finally:

        if temp_folder:

            delete_repository(
                temp_folder
            )