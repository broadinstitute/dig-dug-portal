//main api to access pankbase data endpoints
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const USERNAME = process.env.VUE_APP_API_USERNAME;
const PASSWORD = process.env.VUE_APP_API_PASSWORD;

// Encode credentials for Basic Auth
const credentials = window.btoa(`${USERNAME}:${PASSWORD}`);

// Helper function to make API calls
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Set up headers with Basic Auth
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        // Check if the response status is OK (200-299)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "API request failed");
        }

        // Assuming the response is JSON
        const data = await response.json();
        return data;
    } catch (error) {
        // Handle errors (you can enhance this as needed)
        console.error("API Fetch Error:", error);
        throw error;
    }
}

// API methods based on OpenAPI 3 endpoints

// GET request
export function getResource(resourceId) {
    return apiFetch(`/${resourceId}`, {
        method: "GET",
    });
}

// POST request
export function createResource(resourceData) {
    return apiFetch("/", {
        method: "POST",
        body: JSON.stringify(resourceData),
    });
}

// PUT request
export function updateResource(resourceId, resourceData) {
    return apiFetch(`/${resourceId}`, {
        method: "PUT",
        body: JSON.stringify(resourceData),
    });
}

// DELETE request
export function deleteResource(resourceId) {
    return apiFetch(`/${resourceId}`, {
        method: "DELETE",
    });
}
