import re
import httpx


GITHUB_API = "https://api.github.com"


def parse_github_url(repository_url: str):
    pattern = r"^https?://github\.com/([^/]+)/([^/#?]+)(?:/)?$"

    match = re.match(pattern, repository_url.strip())

    if not match:
        raise ValueError("Invalid GitHub repository URL")

    owner = match.group(1)
    name = match.group(2)

    if name.endswith(".git"):
        name = name[:-4]

    return owner, name


async def get_repository_info(repository_url: str):
    owner, name = parse_github_url(repository_url)

    url = f"{GITHUB_API}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)

    if response.status_code == 404:
        raise ValueError("GitHub repository not found")

    if response.status_code == 403:
        raise ValueError("GitHub API rate limit reached")

    response.raise_for_status()

    data = response.json()

    return {
        "github_url": data["html_url"],
        "owner": data["owner"]["login"],
        "name": data["name"],
        "description": data.get("description"),
        "default_branch": data["default_branch"],
        "stars": data["stargazers_count"],
        "forks": data["forks_count"],
        "language": data.get("language"),
        "last_updated": data["updated_at"],
    }