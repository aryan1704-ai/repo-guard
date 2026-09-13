from app.services.repository_service import (
    clone_repository,
    delete_repository
)

from app.services.secret_scanner import scan_secrets


repo_url = "https://github.com/expressjs/express"

temp_folder = clone_repository(repo_url)

try:

    result = scan_secrets(temp_folder)

    print("\nSECRET SCAN RESULT:")
    print(result)

finally:

    delete_repository(temp_folder)