class QuizApp {
    constructor({apiUrl, quizId, token}){
        this.apiUrl = apiUrl;
        this.quizId = quizId;
        this.token = token;
        this.quizData = {};
        this.userAnswers = {};
        this.currentIndex = 0;
        this.soundEnabled = false;

        this.initElements();
        this.addEventListeners();
        this.loadQuiz();
    }

    initElements(){
        this.quizTitleEl = document.getElementById("quiz-title");
        this.currentStarsEl = document.getElementById("current-stars");
        this.currentGemsEl = document.getElementById("current-gems");
        this.questionsContainer = document.getElementById("questions-container");
        this.submitBtn = document.getElementById("submit-btn");
        this.prevBtn = document.getElementById("prev-btn");
        this.nextBtn = document.getElementById("next-btn");
        this.resultOverlay = document.getElementById("result-overlay");
        this.scoreCircle = document.getElementById("score-circle");
        this.resultMessage = document.getElementById("result-message");
        this.finalGems = document.getElementById("final-gems");
        this.reviewBtn = document.getElementById("review-quiz-btn");
        this.soundToggle = document.getElementById("sound-toggle");
    }

    addEventListeners(){
        document.body.addEventListener('click', () => { this.soundEnabled = true; }, { once: true });
        this.prevBtn.onclick = () => this.showPrevQuestion();
        this.nextBtn.onclick = () => this.showNextQuestion();
        this.submitBtn.onclick = () => this.handleSubmit();
        this.reviewBtn.onclick = () => this.reviewQuiz();
        this.soundToggle.onclick = () => { 
            this.soundEnabled = !this.soundEnabled; 
            this.soundToggle.textContent = this.soundEnabled?"🔔":"🔕"; 
        };
    }

    async loadQuiz(){
        this.submitBtn.disabled = true;
        try {
            const res = await fetch(`${this.apiUrl}/quiz/${this.quizId}`, { headers: { "Authorization": `Bearer ${this.token}` } });
            if(!res.ok) throw new Error("Unauthorized");
            this.quizData = await res.json();

            this.quizTitleEl.innerText = this.quizData.subject;
            this.currentStarsEl.innerText = `⭐ ${this.quizData.current_stars}`;
            this.currentGemsEl.innerText = `💎 ${this.quizData.current_gems}`;

            this.renderQuestions();
            this.showQuestion(0);

            if(this.quizData.completed){
                this.showFinalResult(this.quizData.score_percent, this.quizData.current_gems, this.quizData.score_percent>=50, true);
            }
            console.log(this.quizData)
        } catch(err){
            console.error("Quiz load error:", err);
            alert("Error loading quize");
        } finally { this.submitBtn.disabled = false; }
    }

    renderQuestions(){
        // if not questions
        if (Object.entries(this.quizData.questions).length == 0){
            document.getElementById("container").innerHTML = "<div class='question-card'>This quize is empty</div>"
            return;
        } 

       
        Object.entries(this.quizData.questions).forEach(([qid, qdata]) => {
            const card = document.createElement("div");
            card.classList.add("question-card");
            card.dataset.qid = qid;

            const qtitle = document.createElement("h4");
            qtitle.innerText = qdata.text;
            card.appendChild(qtitle);

            Object.entries(qdata.answers).forEach(([optId,optText]) => {
                const optDiv = document.createElement("div");
                optDiv.classList.add("option");
                optDiv.dataset.optionId = optId;
                optDiv.innerText = optText;
                optDiv.onclick = () => this.selectOption(qid, optId, card);
                card.appendChild(optDiv);
            });

            this.questionsContainer.appendChild(card);

            // Pre-mark answered
            if(qdata.user_answered){
                const ansData = { selected_option_id: qdata.selected_option_id, is_correct: !!qdata.is_correct, correct_option_id: qdata.correct_option_id };
                this.userAnswers[qid] = ansData;
                this.markAnswer(card, ansData);
            }
        });
    }

    showQuestion(index) {
        const cards = document.querySelectorAll(".question-card");
        if (cards.length === 0) return;

        cards.forEach((c, i) => c.style.display = (i === index) ? "block" : "none");

        this.currentIndex = index;
        this.prevBtn.style.display = index === 0 ? "none" : "inline-block";
        this.nextBtn.style.display = index === cards.length - 1 ? "none" : "inline-block";

        const qid = cards[index].dataset.qid;
        const answered = !!this.userAnswers[qid];
        const last = index === cards.length - 1;

        this.submitBtn.disabled = false;
        this.submitBtn.style.opacity = answered ? 0.5 : 1;
        this.submitBtn.innerText = last ? "Submit Quiz" : "Check Answer";

        if (this.quizData.completed) {
            this.submitBtn.disabled = true;
            this.submitBtn.style.opacity = 0.5;
            this.submitBtn.innerText = "Answered";
        }
    }


    showNextQuestion(){ this.showQuestion(this.currentIndex+1); }
    showPrevQuestion(){ this.showQuestion(this.currentIndex-1); }

    selectOption(qid,optId,card){
        if(this.userAnswers[qid] || this.quizData.completed) return;
        card.querySelectorAll(".option").forEach(el=>el.classList.remove("selected"));
        card.querySelector(`[data-option-id='${optId}']`)?.classList.add("selected");
        this.playSound("select");

        this.submitBtn.style.opacity = 1;
        this.submitBtn.disabled = false;
    }

    async handleSubmit(){
        const cards = document.querySelectorAll(".question-card");
        const card = cards[this.currentIndex];
        const qid = card.dataset.qid;
        const last = this.currentIndex === cards.length-1;

        if(this.quizData.completed || this.userAnswers[qid]){
            if(last) return this.finishQuiz();
            return;
        }

        const selected = card.querySelector(".option.selected");
        if(!selected){ alert("Please select an option"); return; }

        const selected_option_id = selected.dataset.optionId;
        try {
            const formData = new FormData();
            formData.append("quiz_id", this.quizId);
            formData.append("question_id", qid);
            formData.append("selected_option_id", selected_option_id);

            const res = await fetch(`${this.apiUrl}/submit-answer`, { method:"POST", headers:{"Authorization":`Bearer ${this.token}`}, body:formData });
            const result = await res.json();
            if(result.error){ alert("Cannot submit answer: "+result.error); return; }

            this.userAnswers[qid] = { selected_option_id, is_correct: !!result.is_correct, correct_option_id: result.correct_option_id };
            this.currentStarsEl.innerText = `⭐ ${result.current_stars}`;
            this.markAnswer(card, this.userAnswers[qid]);
            this.submitBtn.disabled = true;
            this.submitBtn.style.opacity = 0.5;
            this.playSound(result.is_correct?"correct":"wrong");

            if(last) this.finishQuiz();

        } catch(err){ console.error("Submit error:",err); alert("Error submitting answer"); }
    }

    markAnswer(card, ansData){
        const isCorrect = !!ansData.is_correct;
        card.querySelectorAll(".option").forEach(opt=>{
            const oid = opt.dataset.optionId;
            opt.classList.remove("selected","correct","incorrect");
            if(oid==ansData.correct_option_id) opt.classList.add("correct");
            if(oid==ansData.selected_option_id && !isCorrect) opt.classList.add("incorrect");
            if(oid==ansData.selected_option_id && isCorrect) opt.classList.add("selected");
        });
    }

    async finishQuiz(){
        try {
            console.log("Sending finish quiz request...");
            const formData = new FormData();
            formData.append("quiz_id", this.quizId);
            const res = await fetch(`${this.apiUrl}/finish-quiz`, { method:"POST", headers:{"Authorization":`Bearer ${this.token}`}, body:formData });
            const result = await res.json();
            if(!result.ok){ alert("Error finishing quiz"); return; }
            this.showFinalResult(result.score_percent, result.gems_awarded, result.passed);
        } catch(err){ console.error(err); alert("Error submit quiz"); }
    }

    showFinalResult(percent,gems,passed,reviewOnly=false){
        if(!reviewOnly) document.querySelector(".container").style.display="none";
        this.resultOverlay.style.display="flex";
        this.scoreCircle.style.background = passed ? `conic-gradient(var(--success-color) ${percent*3.6}deg, #ddd 0deg)` : `conic-gradient(var(--error-color) ${percent*3.6}deg, #ddd 0deg)`;
        this.scoreCircle.innerText = `${percent}%`;
        this.resultMessage.innerText = passed ? "🎉 You passed the quiz successfully!"  : "❌ You did not pass the quiz.";
        this.finalGems.innerText = `💎 ${gems}`;
    }

    reviewQuiz(){
        this.resultOverlay.style.display="none";
        this.showQuestion(0);
    }

    playSound(type){
        if(!this.soundEnabled) return;
        const sounds = { select:'sound-select', correct:'sound-correct', wrong:'sound-wrong' };
        document.getElementById(sounds[type])?.play().catch(()=>{});
    }
}

// --- Initialize App ---
const userData = JSON.parse(localStorage.getItem("QuizerDataUser"));
if(!userData?.jwt){ window.location.href="login.html"; }
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get("quiz_id");
if(!quizId){ alert("Quiz ID missing"); throw new Error("Quiz ID missing"); }

new QuizApp({ apiUrl:ApiUrl, quizId, token:userData.jwt });
