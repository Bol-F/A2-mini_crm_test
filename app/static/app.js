const statusElement = document.querySelector("#api-status");

async function checkApiHealth() {
    try {
        const response = await fetch("/api/health");
        if (!response.ok) {
            throw new Error(`Health check failed with status ${response.status}`);
        }

        const data = await response.json();
        statusElement.textContent =
            data.status === "ok" ? "Сервер подключён" : "Сервер недоступен";
    } catch (error) {
        statusElement.textContent = "Сервер недоступен";
        console.error(error);
    }
}

checkApiHealth();
