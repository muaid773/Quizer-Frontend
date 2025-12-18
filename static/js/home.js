// Star packs configuration
const starPacks = {
    "small": { stars: 2, gems: 1 },
    "medium": { stars: 5, gems: 10 },
    "large": { stars: 10, gems: 15 },
    "huge": { stars: 15, gems: 20 },
    "luxury": { stars: 50, gems: 30 },
    "legendary": { stars: 100, gems: 69 }
};

// Retrieve user data and token
const userData = JSON.parse(localStorage.getItem(LocalDataName));
const token = userData?.jwt;

// Redirect to login if token not available
if (!token) {
    window.location.href = "login.html";
}

// ==============================
// Reset Quiz Function
// ==============================
async function ResetQuiz(quiz_id) {
    try {
        const res = await fetch(`${ApiUrl}/quiz/${quiz_id}`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error("Unauthorized");
        }
        const data = await res.json();
        if (data.error){alert(data.error)}else{alert("Reset quiz is succssful")};
        return data.ok === true;

    } catch (err) {
        console.error("Fetch error:", err);
        return false;
    }
}

// ==============================
// Load Home Data Function
// ==============================
async function loadHomeData() {
    try {
        const res = await fetch(`${ApiUrl}/home-data`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Request failed");
        }

        const homeData = await res.json();

        updateUserHeader(homeData);
        renderSubjects(homeData.subjects);

    } catch (err) {
        console.error("loadHomeData error:", err);
    }
}
function updateUserHeader(data) {
    document.getElementById("welcome-text").innerText = `Welcome ${data.username}!`;
    document.getElementById("gem-count").innerText = `💎 ${data.gems}`;
    document.getElementById("stars-count").innerText = `⭐ ${data.stars}`;
}
function createSection(subject) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "section";

    const header = createSectionHeader(subject.title);
    const content = createSectionContent(subject.quizes);

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(content);

    header.onclick = () => toggleSection(content, header);

    return sectionDiv;
}
function createSectionHeader(title) {
    const header = document.createElement("div");
    header.className = "section-header";

    const h3 = document.createElement("h3");
    h3.innerText = title;

    const arrow = document.createElement("span");
    arrow.className = "toggle-arrow";
    arrow.innerHTML = "&#9660;";

    header.appendChild(h3);
    header.appendChild(arrow);

    return header;
}
function createSectionContent(quizzes) {
    const content = document.createElement("div");
    content.className = "section-content";

    quizzes.forEach(quiz => {
        content.appendChild(createQuizItem(quiz));
    });

    return content;
}
function createQuizItem(quiz) {
    const quizDiv = document.createElement("div");
    quizDiv.className = "quiz";

    const openBtn = document.createElement("div");
    openBtn.className = "quiz-open";
    openBtn.innerText = quiz.title;
    openBtn.title = "Open quiz";
    openBtn.onclick = () => {
        window.location.href = `quiz.html?quiz_id=${quiz.id}`;
    };

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "quiz-options";

    if (quiz.completed === true || quiz.completed === 1) {
        optionsDiv.appendChild(createCompletedBadge());
    }

    optionsDiv.appendChild(createResetBadge(quiz.id, optionsDiv));

    quizDiv.appendChild(openBtn);
    quizDiv.appendChild(optionsDiv);

    return quizDiv;
}
function createCompletedBadge() {
    const badge = document.createElement("span");
    badge.className = "badge badge-completed";
    badge.innerHTML = "&#9989;";
    badge.title = "Passed";
    return badge;
}
function createResetBadge(quizId, container) {
    const badge = document.createElement("span");
    badge.className = "badge badge-reset";
    badge.innerHTML = "&#9851;";
    badge.title = "Reset quiz";
    badge.style.cursor = "pointer";

    badge.onclick = async () => {
        badge.innerHTML = "&#9203;"; // ⏳
        badge.style.pointerEvents = "none";

        try {
            const ok = await ResetQuiz(quizId);

            if (ok) {
                const completed = container.querySelector(".badge-completed");
                if (completed) completed.remove();
                badge.remove(); // إزالة البادج بعد إعادة الضبط
            } else {
                badge.innerHTML = "&#9888;"; // ⚠ فشل
                badge.style.pointerEvents = "auto";
            }
        } catch (err) {
            console.error(err);
            badge.innerHTML = "&#9888;"; // ⚠ خطأ
            badge.style.pointerEvents = "auto";
        }
    };


    return badge;
}
function toggleSection(content, header) {
    const arrow = header.querySelector(".toggle-arrow");
    const open = content.style.display === "block";

    content.style.display = open ? "none" : "block";
    arrow.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
}

function renderSubjects(subjects) {
    const container = document.getElementById("sections-container");
    container.innerHTML = "";

    subjects.forEach(subject => {
        const section = createSection(subject);
        container.appendChild(section);
    });
}

// ==============================
// Collapse All Sections
// ==============================
document.getElementById("collapse-all").onclick = () => {
    document.querySelectorAll(".section-content").forEach(content => content.style.display = "none");
    document.querySelectorAll(".toggle-arrow").forEach(arrow => arrow.style.transform = "rotate(0deg)");
};

// Load home data initially
loadHomeData();

// ==============================
// Star Packs Modal Logic
// ==============================
const ButStarsModal = document.getElementById("buy-stars");
const packagsRow = document.getElementById("packags-row");

// Render Star Packs
function renderStarPacks() {
    packagsRow.innerHTML = "";
    for (const [name, pack] of Object.entries(starPacks)) {
        const card = document.createElement("div");
        card.className = "packag";
        card.style.cssText = `
            border: 1px solid #ccc; border-radius: 12px; padding: 15px; margin: 10px;
            display: inline-block; width: 150px; text-align: center; background-color: var(--background-light); color: var(--text-light);
        `;
        card.innerHTML = `
            <div><strong>${name.charAt(0).toUpperCase() + name.slice(1)}</strong></div>
            <div><span class="badge badge-star">${pack.stars} ⭐</span></div>
            <div><span class="badge badge-gem">${pack.gems} 💎</span></div>
            <button class="badge-info">Buy</button>
        `;
        const btn = card.querySelector("button");
        btn.onclick = () => purchasePack(name);
        packagsRow.appendChild(card);
    }
}

// Purchase Star Pack
async function purchasePack(packName) {
    try {
        const res = await fetch(`${ApiUrl}/buy-stars/${packName}`, {  // <-- هنا
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if(res.ok && data.ok) {
            alert(`You bought ${data.stars} stars!`);
            document.getElementById("buy-stars").style.display = "none"; 
            document.getElementById("stars-count").innerText = `⭐ ${data.stars}`;
        } else {
            alert(data.error || "Purchase failed");
        }
    } catch(err) {
        console.error(err);
        alert("Error during purchase");
    }
}

// Open/Close Star Modal
document.getElementById("stars-count").onclick = () => {
    renderStarPacks();
    ButStarsModal.style.display = "block";
};
document.getElementById("close-buy-stars").onclick = () => ButStarsModal.style.display = "none";
window.addEventListener("click", (e) => {
    if (e.target === ButStarsModal) ButStarsModal.style.display = "none";
});

// ==============================
// Developer Info Modal Logic
// ==============================
const devBtn = document.getElementById("dev-info-btn");
const devModal = document.getElementById("dev-info-modal");
const closeBtn = document.getElementById("close-dev-modal");
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

devBtn.addEventListener("click", () => devModal.style.display = "block");
closeBtn.addEventListener("click", () => devModal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === devModal) devModal.style.display = "none";
});

// Tabs switching
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("content-" + tab.dataset.lang).classList.add("active");
    });
});