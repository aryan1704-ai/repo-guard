import os


IGNORED_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build"
}


CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".cs",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".swift",
    ".kt"
}


def analyze_code_health(repository_path: str):

    total_files = 0
    code_files = 0
    total_lines = 0

    readme_found = False
    test_files = 0
    dependency_files = 0
    todo_count = 0
    large_files = 0

    languages = {}

    dependency_names = {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "pom.xml",
        "build.gradle",
        "go.mod",
        "Cargo.toml"
    }

    for root, dirs, files in os.walk(repository_path):

        # Don't scan unnecessary directories
        dirs[:] = [
            directory
            for directory in dirs
            if directory not in IGNORED_DIRS
        ]

        for filename in files:

            filepath = os.path.join(root, filename)

            total_files += 1

            # README detection
            if filename.lower().startswith("readme"):
                readme_found = True

            # Dependency file detection
            if filename in dependency_names:
                dependency_files += 1

            # Test file detection
            if (
                "test" in filename.lower()
                or "tests" in root.lower()
            ):
                test_files += 1

            try:
                file_size = os.path.getsize(filepath)

                # 1 MB+
                if file_size > 1024 * 1024:
                    large_files += 1

            except OSError:
                continue

            extension = os.path.splitext(filename)[1].lower()

            if extension not in CODE_EXTENSIONS:
                continue

            code_files += 1

            language = extension.replace(".", "")

            languages[language] = languages.get(language, 0) + 1

            try:
                with open(
                    filepath,
                    "r",
                    encoding="utf-8",
                    errors="ignore"
                ) as file:

                    for line in file:

                        total_lines += 1

                        if "TODO" in line.upper() or "FIXME" in line.upper():
                            todo_count += 1

            except (OSError, UnicodeDecodeError):
                continue

    return {
        "total_files": total_files,
        "code_files": code_files,
        "total_lines": total_lines,
        "readme_found": readme_found,
        "test_files": test_files,
        "dependency_files": dependency_files,
        "todo_count": todo_count,
        "large_files": large_files,
        "languages": languages
    }