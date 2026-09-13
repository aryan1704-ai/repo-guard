// RepoGuard - Common Navigation

document.addEventListener("DOMContentLoaded", function () {

    const navigation = {
        dashboard: "dashboard.html",
        security: "scan-results.html",
        dependencies: "dependencies.html",
        secrets: "secrets.html",
        cicd: "cicd.html",
        health: "code-health.html",
        ai: "ai-report.html",
        history: "scan-history.html",
        repository: "repository-details.html",
        settings: "settings.html"
    };

    // Find navigation elements by data-page
    document.querySelectorAll("[data-page]").forEach(function (element) {

        const page = element.getAttribute("data-page");

        if (navigation[page]) {

            element.addEventListener("click", function (event) {

                event.preventDefault();

                window.location.href = navigation[page];

            });
        }
    });

});