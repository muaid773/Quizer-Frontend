document.getElementById("submit-btn").addEventListener("click", async () => {
    const adminKey = document.getElementById("admin-key").value.trim();
    const email = document.getElementById("email").value.trim();
    const resultDiv = document.getElementById("result");

    if (!adminKey || !email) {
        resultDiv.textContent = "Please fill in all fields";
        resultDiv.style.color = "red";
        return;
    }

    try {
        const userData = JSON.parse(localStorage.getItem("QuizerDataUser") || "{}");
        if (!userData.jwt) {
            resultDiv.textContent = "Please log in as admin";
            resultDiv.style.color = "red";
            return;
        }
        const urlEncoded = new URLSearchParams({admin_key:adminKey, email:email});
        const res = await fetch(`${ApiUrl}/admin`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${userData.jwt}`,
                        "Content-Type": "application/x-www-form-urlencoded" },
            body:urlEncoded
        });

        const data = await res.json();
        if (data.ok) {
            resultDiv.style.color = "green";
            resultDiv.textContent = data.message;
            alert("Admin successfully activated");
            window.location.href='/admin/panel.html';
        } else {
            resultDiv.style.color = "red";
            resultDiv.textContent = data.message;
        }

    } catch (err) {
        console.error(err);
        resultDiv.textContent = "An error occurred while connecting to the server";
        resultDiv.style.color = "red";
    }
});