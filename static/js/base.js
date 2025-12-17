// ================================
// API Configuration
// ================================

// Base URL of the Quizer Backend API (do NOT include trailing '/')
const ApiUrl = "https://quizer-m9vw.onrender.com";

// Key for storing user data in LocalStorage
const LocalDataName = "QuizerDataUser";

// -------------------------------
// Validation: Ensure API URL is set
// -------------------------------
if (!ApiUrl || ApiUrl.trim() === "") {
    const errorMsg = `
[Quizer Frontend] Error: API URL is not defined.
Please set the 'ApiUrl' variable in /static/js/base.js
Example: const ApiUrl = "https://your-backend-url.com";
    `;
    console.error(errorMsg);
    alert(errorMsg);
    throw new Error("API URL not configured. Execution stopped.");
}
