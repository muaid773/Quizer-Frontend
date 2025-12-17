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