import os
import shutil
import tempfile

from git import Repo
from git.exc import GitCommandError


def clone_repository(repository_url: str):
    temp_dir = tempfile.mkdtemp(prefix="repoguard_")

    try:
        Repo.clone_from(
            repository_url,
            temp_dir,
            depth=1,
            single_branch=True
        )

        return temp_dir

    except GitCommandError as e:
        shutil.rmtree(temp_dir, ignore_errors=True)

        raise RuntimeError(
            f"Failed to clone repository: {e}"
        )

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)

        raise RuntimeError(
            f"Repository acquisition failed: {e}"
        )


def delete_repository(temp_dir: str):
    if temp_dir and os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)