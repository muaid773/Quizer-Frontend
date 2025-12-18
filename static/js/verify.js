const stored = localStorage.getItem(LocalDataName);
if (!stored) {
    window.location.href = "login.html";
} 
const userData = JSON.parse(stored);

const verifyBtn = document.getElementById('verifyBtn');
const codeInput = document.getElementById('verifyCode');

verifyBtn.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    if (!code) return alert('Enter the verification code');

    const formData = new FormData();
    formData.append("username", userData.username);
    formData.append("email", userData.email);
    formData.append("code", code);

    try {
        const response = await fetch(`${ApiUrl}/verify`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log("Verify response:", data);

        if (data.access_token) {
            alert("Verification successful");
            localStorage.setItem(LocalDataName, JSON.stringify({
                jwt: data.access_token,
                token_type: data.token_type,
                username: data.username,
                email: data.email
            }));

            location.replace("home.html");

        } else {
            alert(data.detail || 'Invalid verification code');
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Please try again later.');
    }
});
