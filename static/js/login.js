document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Dont reload page
    // Get form data 
    const formdata = new FormData(e.target);
    console.log(e)
    // Turn formdata to x-www-form-urlencoded
    const urlEncoded = new URLSearchParams(formdata);

    try {
        const response = await fetch(`${ApiUrl}/login`, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
            body: urlEncoded
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem(LocalDataName, JSON.stringify({
                jwt: data.access_token,
                token_type: data.token_type,
                username: data.username,
                email: data.email
            }));
            console.log("Stored", data);
            window.location.href = "home.html"; 
        } else {
            console.error("Login error:", data.detail);
            alert("Login error: " + data.detail);
        }
    } catch (err) {
        console.error("Network error:", err);
        alert("Failed to connect to the server");
    }
});