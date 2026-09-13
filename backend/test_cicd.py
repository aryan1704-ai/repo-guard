from app.services.repository_service import (
    clone_repository,
    delete_repository
)

from app.services.cicd_scanner import scan_cicd


repo_url = "https://github.com/expressjs/express"

temp_folder = clone_repository(repo_url)

try:

    result = scan_cicd(temp_folder)

    print("\nCI/CD SCAN RESULT:")
    print(result)

finally:

    delete_repository(temp_folder)