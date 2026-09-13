import json
import os
import re

import httpx


def check_vulnerabilities(
    name: str,
    version: str | None,
    ecosystem: str
):
    if not version:
        return 0

    # OSV works best with exact versions.
    # Skip versions that are ranges or incomplete.
    if any(char in version for char in ["^", "~", ">", "<", "=", "*", "[", "]", ","]):
        return 0

    if ecosystem == "npm" and not re.match(
        r"^\d+\.\d+\.\d+$",
        version
    ):
        return 0

    if ecosystem == "PyPI" and not re.match(
        r"^\d+\.\d+(\.\d+)?([a-zA-Z0-9.-]*)?$",
        version
    ):
        return 0

    payload = {
        "package": {
            "name": name,
            "ecosystem": ecosystem
        },
        "version": version
    }

    try:
        response = httpx.post(
            "https://api.osv.dev/v1/query",
            json=payload,
            timeout=10.0
        )

        if response.status_code != 200:
            return 0

        data = response.json()

        return len(
            data.get("vulns", [])
        )

    except Exception:
        return 0


def parse_requirement_line(line: str):
    """
    Parse a requirements.txt style dependency.
    """

    line = line.strip()

    if (
        not line
        or line.startswith("#")
        or line.startswith("-")
    ):
        return None

    match = re.match(
        r"^([A-Za-z0-9_.-]+)"
        r"\s*(?:==\s*([A-Za-z0-9_.+-]+))?",
        line
    )

    if not match:
        return None

    return {
        "name": match.group(1),
        "version": match.group(2),
        "ecosystem": "PyPI"
    }


def scan_dependencies(repository_path: str):

    dependencies = []

    # ==================================================
    # package.json
    # ==================================================

    package_json = os.path.join(
        repository_path,
        "package.json"
    )

    if os.path.exists(package_json):

        try:
            with open(
                package_json,
                "r",
                encoding="utf-8"
            ) as file:

                data = json.load(file)

            for section in [
                "dependencies",
                "devDependencies"
            ]:

                for name, version in data.get(
                    section,
                    {}
                ).items():

                    dependencies.append({
                        "name": name,
                        "version": version,
                        "ecosystem": "npm"
                    })

        except (
            OSError,
            json.JSONDecodeError
        ):
            pass

    # ==================================================
    # requirements.txt
    # ==================================================

    requirements_file = os.path.join(
        repository_path,
        "requirements.txt"
    )

    if os.path.exists(requirements_file):

        try:

            with open(
                requirements_file,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                for line in file:

                    dependency = parse_requirement_line(
                        line
                    )

                    if dependency:
                        dependencies.append(
                            dependency
                        )

        except OSError:
            pass

    # ==================================================
    # pyproject.toml
    # ==================================================

    pyproject_file = os.path.join(
        repository_path,
        "pyproject.toml"
    )

    if os.path.exists(pyproject_file):

        try:

            with open(
                pyproject_file,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                content = file.read()

            # Look specifically for:
            # dependencies = [
            #
            # "package>=1.0",
            # "requests==2.31.0"
            # ]

            dependency_block = re.search(
                r"dependencies\s*=\s*\[(.*?)\]",
                content,
                re.DOTALL
            )

            if dependency_block:

                block = dependency_block.group(1)

                matches = re.findall(
                    r"""["']([^"']+)["']""",
                    block
                )

                for dependency in matches:

                    name_match = re.match(
                        r"^([A-Za-z0-9_.-]+)",
                        dependency
                    )

                    if not name_match:
                        continue

                    name = name_match.group(1)

                    version_match = re.search(
                        r"==\s*([A-Za-z0-9_.+-]+)",
                        dependency
                    )

                    version = (
                        version_match.group(1)
                        if version_match
                        else None
                    )

                    dependencies.append({
                        "name": name,
                        "version": version,
                        "ecosystem": "PyPI"
                    })

        except OSError:
            pass

    # ==================================================
    # pom.xml
    # ==================================================

    pom_file = os.path.join(
        repository_path,
        "pom.xml"
    )

    if os.path.exists(pom_file):

        try:

            with open(
                pom_file,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                content = file.read()

            dependency_blocks = re.findall(
                r"<dependency>(.*?)</dependency>",
                content,
                re.DOTALL
            )

            for block in dependency_blocks:

                group_match = re.search(
                    r"<groupId>\s*(.*?)\s*</groupId>",
                    block
                )

                artifact_match = re.search(
                    r"<artifactId>\s*(.*?)\s*</artifactId>",
                    block
                )

                version_match = re.search(
                    r"<version>\s*(.*?)\s*</version>",
                    block
                )

                if group_match and artifact_match:

                    name = (
                        f"{group_match.group(1)}:"
                        f"{artifact_match.group(1)}"
                    )

                    dependencies.append({
                        "name": name,
                        "version": (
                            version_match.group(1)
                            if version_match
                            else None
                        ),
                        "ecosystem": "Maven"
                    })

        except OSError:
            pass

    return dependencies