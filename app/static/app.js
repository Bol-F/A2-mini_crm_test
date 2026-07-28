const statusElement = document.querySelector("#api-status");
const leadForm = document.querySelector("#lead-form");
const errorMessage = document.querySelector("#form-errors");
const successMessage = document.querySelector("#save-success");
const emptyState = document.querySelector("#leads-empty-state");
const leadCards = document.querySelector("#lead-cards");
const saveButton = leadForm.querySelector('button[type="submit"]');

let isSubmitting = false;

function showMessage(element, message) {
    element.textContent = message;
    element.hidden = false;
}

function hideMessage(element) {
    element.textContent = "";
    element.hidden = true;
}

function getLeadPayload() {
    const formData = new FormData(leadForm);

    return {
        client_name: formData.get("client_name").trim(),
        phone: formData.get("phone").trim(),
        lead_source: formData.get("lead_source"),
        responsible: formData.get("responsible"),
        deal_stage: formData.get("deal_stage"),
        technical_spec_requested: formData.has("technical_spec_requested"),
    };
}

function validateLead(payload) {
    if (!payload.client_name) {
        return "Укажите имя клиента.";
    }
    if (!payload.phone) {
        return "Укажите номер телефона.";
    }
    return "";
}

function formatApiError(responseData, status) {
    if (status >= 500) {
        return "Ошибка сервера. Попробуйте сохранить лид ещё раз.";
    }

    if (Array.isArray(responseData?.detail)) {
        const fieldNames = {
            client_name: "имя клиента",
            phone: "номер телефона",
            lead_source: "источник лида",
            responsible: "ответственного",
            deal_stage: "этап сделки",
            technical_spec_requested: "запрос ТЗ",
        };
        const invalidFields = responseData.detail.map((error) => {
            const field = Array.isArray(error?.loc) ? error.loc.at(-1) : null;
            return fieldNames[field] ?? "данные формы";
        });
        return `Проверьте заполнение полей: ${[...new Set(invalidFields)].join(", ")}.`;
    }

    if (typeof responseData?.detail === "string" && responseData.detail.trim()) {
        return responseData.detail;
    }

    return "Не удалось сохранить лид. Проверьте данные и попробуйте ещё раз.";
}

function validateCreatedLead(lead) {
    const requiredTextFields = [
        "client_name",
        "phone",
        "lead_source",
        "responsible",
        "deal_stage",
        "created_at",
    ];
    const hasRequiredText = requiredTextFields.every(
        (field) => typeof lead?.[field] === "string" && lead[field].trim(),
    );
    const hasValidDate = !Number.isNaN(new Date(lead?.created_at).getTime());

    if (
        !hasRequiredText ||
        typeof lead?.id !== "number" ||
        typeof lead?.technical_spec_requested !== "boolean" ||
        !hasValidDate
    ) {
        throw new Error("Сервер вернул неполные данные созданного лида.");
    }
}

function createCardRow(label, value) {
    const row = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = `${label}: `;
    row.append(labelElement, document.createTextNode(value));
    return row;
}

function displayLead(lead) {
    validateCreatedLead(lead);

    const card = document.createElement("article");
    const title = document.createElement("h3");
    const createdAt = new Date(lead.created_at);
    const formattedDate = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(createdAt);

    card.className = "lead-card";
    title.textContent = lead.client_name;
    card.append(
        title,
        createCardRow("Телефон", lead.phone),
        createCardRow("Источник лида", lead.lead_source),
        createCardRow("Ответственный", lead.responsible),
        createCardRow("Этап сделки", lead.deal_stage),
        createCardRow(
            "Запрошено ТЗ",
            lead.technical_spec_requested ? "Да" : "Нет",
        ),
        createCardRow("Создан", formattedDate),
    );

    leadCards.prepend(card);
    emptyState.hidden = true;
}

async function submitLead(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    hideMessage(errorMessage);
    hideMessage(successMessage);

    const payload = getLeadPayload();
    const validationError = validateLead(payload);
    if (validationError) {
        showMessage(errorMessage, validationError);
        return;
    }

    isSubmitting = true;
    saveButton.disabled = true;

    try {
        const response = await fetch("/api/leads", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch {
            throw new Error("Сервер вернул некорректный ответ.");
        }

        if (!response.ok) {
            throw new Error(formatApiError(responseData, response.status));
        }

        displayLead(responseData);
        leadForm.reset();
        showMessage(successMessage, "Лид успешно сохранён.");
    } catch (error) {
        const message =
            error instanceof TypeError
                ? "Не удалось связаться с сервером. Проверьте подключение."
                : error.message;
        showMessage(
            errorMessage,
            message || "Произошла неизвестная ошибка. Попробуйте ещё раз.",
        );
    } finally {
        isSubmitting = false;
        saveButton.disabled = false;
    }
}

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

leadForm.addEventListener("submit", submitLead);
checkApiHealth();
