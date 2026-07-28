const statusElement = document.querySelector("#api-status");

async function checkApiHealth() {
    try {
        const response = await fetch("/api/health");
        if (!response.ok) {
            throw new Error(`Health check failed with status ${response.status}`);
        }

        const data = await response.json();
        statusElement.textContent = `API status: ${data.status}`;
    } catch (error) {
        statusElement.textContent = "API status: unavailable";
        console.error(error);
    }
}

checkApiHealth();

