const API_URL = "http://127.0.0.1:8000";

const scanId = localStorage.getItem("repoguard_scan_id");

const repositoryName =
    document.getElementById("repositoryName");

const repositoryDescription =
    document.getElementById("repositoryDescription");

const repositoryOwner =
    document.getElementById("repositoryOwner");

const repositoryLanguage =
    document.getElementById("repositoryLanguage");

const repositoryStars =
    document.getElementById("repositoryStars");

const repositoryForks =
    document.getElementById("repositoryForks");

const repositoryBranch =
    document.getElementById("repositoryBranch");

const repositoryUpdated =
    document.getElementById("repositoryUpdated");

const githubLink =
    document.getElementById("githubLink");

const githubLinkBottom =
    document.getElementById("githubLinkBottom");

const repositoryNameUrl =
    document.getElementById("repositoryNameUrl");

const errorMessage =
    document.getElementById("errorMessage");


async function loadRepositoryDetails() {

    if (!scanId) {

        showError("No scan selected.");

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/scans/${scanId}`
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load repository details."
            );
        }


        const scan = await response.json();

        const repository = scan.repository;


        if (!repository) {

            throw new Error(
                "Repository information is unavailable."
            );
        }


        displayRepository(repository);

    } catch (error) {

        console.error(
            "Repository details error:",
            error
        );

        showError(error.message);
    }
}


function displayRepository(repository) {

    repositoryName.textContent =
        `${repository.owner}/${repository.name}`;


    repositoryDescription.textContent =
        repository.description ||
        "No repository description available.";


    repositoryOwner.textContent =
        repository.owner || "--";


    repositoryLanguage.textContent =
        repository.language || "Not specified";


    repositoryStars.textContent =
        formatNumber(repository.stars);


    repositoryForks.textContent =
        formatNumber(repository.forks);


    repositoryBranch.textContent =
        repository.default_branch || "--";


    repositoryUpdated.textContent =
        formatDate(repository.last_updated);


    if (repository.github_url) {

        githubLink.href =
            repository.github_url;

        githubLink.target = "_blank";

        githubLink.rel =
            "noopener noreferrer";


        githubLinkBottom.href =
            repository.github_url;

        githubLinkBottom.target = "_blank";

        githubLinkBottom.rel =
            "noopener noreferrer";


        repositoryNameUrl.textContent =
            repository.github_url;
    }
}


function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "--";
    }


    return Number(value).toLocaleString();
}


function formatDate(value) {

    if (!value) {

        return "--";
    }


    const date = new Date(value);


    if (Number.isNaN(date.getTime())) {

        return "--";
    }


    return date.toLocaleString();
}


function showError(message) {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent = message;

    errorMessage.style.display = "block";
}


loadRepositoryDetails();