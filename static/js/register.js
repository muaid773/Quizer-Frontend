document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Do not reload the page

    // Get form data
    const formData = new FormData(e.target);

    // Convert FormData to x-www-form-urlencoded
    const urlEncoded = new URLSearchParams(formData);

    try {
        const response = await fetch(`${ApiUrl}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: urlEncoded
        });

        const data = await response.json();

        if (response.ok) {
            if (data.status === "ok") {
                localStorage.setItem(LocalDataName, JSON.stringify({
                    username: data.username,
                    email: data.email
                }));

                console.log("User data stored:", data);
                window.location.href = "verify.html";
            }
        } else {
            console.error("Registration failed:", data.detail);
            alert("Registration failed: " + data.detail);
        }

    } catch (err) {
        console.error("Network error:", err);
        alert("Unable to connect to the server. Please try again later.");
    }
});



const devBtn = document.getElementById("dev-info-btn");
const devModal = document.getElementById("dev-info-modal");
const closeBtn = document.getElementById("close-dev-modal");
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
devBtn.addEventListener("click", () => {
    devModal.style.display = "block";
});
closeBtn.addEventListener("click", () => {
    devModal.style.display = "none";
});
window.addEventListener("click", (e) => {
    if(e.target === devModal) devModal.style.display = "none";
});
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("content-" + tab.dataset.lang).classList.add("active");
    });
});