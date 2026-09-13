import os
import re
import yaml


WORKFLOW_DIR = os.path.join(
    ".github",
    "workflows"
)


def scan_cicd(repository_path: str):
    """
    Analyze GitHub Actions workflow files
    for common CI/CD security risks.
    """

    workflows_path = os.path.join(
        repository_path,
        WORKFLOW_DIR
    )

    findings = []

    if not os.path.exists(workflows_path):
        return {
            "status": "success",
            "message": "No GitHub Actions workflows found",
            "workflows_found": 0,
            "findings": []
        }

    workflow_files = []

    for filename in os.listdir(workflows_path):

        if filename.lower().endswith(
            (".yml", ".yaml")
        ):
            workflow_files.append(filename)

    for filename in workflow_files:

        filepath = os.path.join(
            workflows_path,
            filename
        )

        try:
            with open(
                filepath,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                content = file.read()

        except OSError:
            continue

        # ==========================================
        # 1. Dangerous pull_request_target
        # ==========================================

        if "pull_request_target" in content:

            findings.append({
                "workflow": filename,
                "severity": "HIGH",
                "rule": "dangerous_pull_request_target",
                "description":
                    "Workflow uses pull_request_target. "
                    "This can be dangerous when untrusted "
                    "pull request code is executed."
            })

        # ==========================================
        # 2. Excessive write permissions
        # ==========================================

        permissions_match = re.search(
            r"permissions\s*:\s*\n"
            r"(?:\s+[^\n]+\n?)+",
            content
        )

        if permissions_match:

            permission_block = permissions_match.group(0)

            if re.search(
                r"contents\s*:\s*write",
                permission_block
            ):

                findings.append({
                    "workflow": filename,
                    "severity": "MEDIUM",
                    "rule": "excessive_write_permissions",
                    "description":
                        "Workflow grants write permission "
                        "to repository contents."
                })

        # ==========================================
        # 3. Unpinned GitHub Actions
        # ==========================================

        uses_lines = re.findall(
            r"uses:\s*([^\s]+)",
            content
        )

        for action in uses_lines:

            # Safe examples:
            # actions/checkout@v4
            # actions/checkout@abc123...

            if "@" not in action:
                continue

            reference = action.split("@", 1)[1]

            # SHA references are preferred.
            is_sha = bool(
                re.fullmatch(
                    r"[a-fA-F0-9]{40}",
                    reference
                )
            )

            if not is_sha:

                findings.append({
                    "workflow": filename,
                    "severity": "LOW",
                    "rule": "unpinned_action",
                    "description":
                        f"GitHub Action '{action}' "
                        "is not pinned to a commit SHA."
                })

        # ==========================================
        # 4. Secrets used in shell commands
        # ==========================================

        if re.search(
            r"\$\{\{\s*secrets\.[^}]+\}\}",
            content
        ):

            findings.append({
                "workflow": filename,
                "severity": "MEDIUM",
                "rule": "secret_in_workflow",
                "description":
                    "Workflow references GitHub secrets. "
                    "Review how secrets are passed to commands "
                    "to avoid accidental exposure."
            })

        # ==========================================
        # 5. Potential unsafe shell interpolation
        # ==========================================

        if re.search(
            r"run:\s*.*\$\{\{\s*github\.event\.",
            content
        ):

            findings.append({
                "workflow": filename,
                "severity": "HIGH",
                "rule": "unsafe_expression",
                "description":
                    "Workflow appears to directly interpolate "
                    "GitHub event data into a shell command."
            })

        # ==========================================
        # 6. curl | bash / wget | sh
        # ==========================================

        if re.search(
            r"(curl|wget)[^\n|]*\|\s*(bash|sh)",
            content,
            re.IGNORECASE
        ):

            findings.append({
                "workflow": filename,
                "severity": "HIGH",
                "rule": "remote_script_execution",
                "description":
                    "Workflow downloads and directly executes "
                    "a remote script."
            })

    return {
        "status": "success",
        "message": "CI/CD scan completed",
        "workflows_found": len(workflow_files),
        "findings": findings
    }