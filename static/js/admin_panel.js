const JWT = JSON.parse(localStorage.getItem(LocalDataName))?.jwt || "";
let selectedSubjectId = null;
let selectedQuizId = null;

// DOM Elements
const DOM = {
    subjectList: document.getElementById("subject-list"),
    quizList: document.getElementById("quiz-list"),
    questionList: document.getElementById("question-list"),
    quizzesTitle: document.getElementById("quizzes-title"),
    questionManagement: document.getElementById("question-management"),
    addSubjectBtn: document.getElementById("add-subject-btn"),
    addQuizBtn: document.getElementById("add-quiz-btn"),
    addQuestionBtn: document.getElementById("add-question-btn"),
    listViewArea: document.getElementById("list-view-area"),
    formEditArea: document.getElementById("form-edit-area"),
    formTitle: document.getElementById("form-title"),
    formFields: document.getElementById("form-fields"),
    editForm: document.getElementById("edit-form"),
    formCancel: document.getElementById("form-cancel")
};

// --- API Fetch ---
async function apiFetch(endpoint, method="GET", body=null){
    const headers = { "Authorization": `Bearer ${JWT}` };
    const options = { method, headers };
    if(body) options.body = body;
    try {
        const res = await fetch(ApiUrl + endpoint, options);
        const data = await res.json();
        if(!res.ok){ alert(data.detail||res.message||res.statusText); return {ok:false}; }
        return {ok:true, ...data};
    } catch(e){ console.error(e); alert("Network error"); return {ok:false}; }
}

// --- Form Utilities ---
function createFormElement(f){
    const group=document.createElement("div"); group.className="form-group";
    const label=document.createElement("label"); label.textContent=f.label||f.name; label.htmlFor=f.name;
    let input;
    if(f.type==="textarea"){ input=document.createElement("textarea"); input.rows=4; }
    else { input=document.createElement("input"); input.type=f.type||"text"; }
    input.name=f.name; input.value=f.value!==undefined?f.value:""; input.placeholder=f.placeholder||"";
    group.appendChild(label); group.appendChild(input);
    return group;
}
function openForm(title, fields=[], submitHandler, specialContent=null){
    DOM.formTitle.textContent=title;
    DOM.formFields.innerHTML="";
    fields.forEach(f=>DOM.formFields.appendChild(createFormElement(f)));
    if(specialContent) DOM.formFields.appendChild(specialContent);
    DOM.listViewArea.classList.add("hidden"); DOM.formEditArea.classList.remove("hidden");
    DOM.editForm.onsubmit=async e=>{
        e.preventDefault();
        const fd=new FormData(DOM.editForm);
        await submitHandler(fd);
        closeForm();
    };
}
function closeForm(){ DOM.listViewArea.classList.remove("hidden"); DOM.formEditArea.classList.add("hidden"); }
DOM.formCancel.onclick=closeForm();

// --- Subjects ---
async function loadSubjects(){
    const res=await apiFetch("/admin/subjects");
    DOM.subjectList.innerHTML="";
    if(res.ok && Array.isArray(res.subjects)){
        res.subjects.forEach(s=>{
            const card=document.createElement("div"); card.className=`card ${s.id===selectedSubjectId?'active':''}`;
            card.innerHTML=`
                <span>${s.title}</span>
                <div>
                    <button class="btn btn-warning" onclick="event.stopPropagation(); editSubject(${s.id},'${s.title}')">Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteSubject(${s.id})">Delete</button>
                </div>`;
            card.onclick=()=>selectSubject(s.id,s.title);
            DOM.subjectList.appendChild(card);
        });
    }
}
function editSubject(id,title){
    openForm("Edit Subject",[{name:"title",label:"Subject Title",value:title}],async fd=>{
        await apiFetch(`/admin/subjects/${id}`,"PUT",fd);
        await loadSubjects();
    });
}
DOM.addSubjectBtn.onclick=()=>openForm("Add Subject",[{name:"title",label:"Subject Title"}],async fd=>{
    await apiFetch("/admin/subjects","POST",fd);
    await loadSubjects();
});
async function deleteSubject(id){ if(!confirm("Delete subject?")) return; const res=await apiFetch(`/admin/subjects/${id}`,"DELETE"); if(res.ok) await loadSubjects(); }

// --- Quizzes ---
async function loadQuizzes(subjectId){
    const res=await apiFetch(`/admin/quizzes/${subjectId}`);
    DOM.quizList.innerHTML="";
    if(res.ok && Array.isArray(res.quizzes)){
        res.quizzes.forEach(q=>{
            const card=document.createElement("div"); card.className="card";
            card.innerHTML=`
                <div class="card-details">
                    <div class="card-title">${q.title}</div>
                    <div>Reward: ${q.gems_reward} Gems</div>
                </div>
                <div>
                    <button class="btn btn-warning" onclick="event.stopPropagation(); editQuiz(${q.id},'${q.title}',${q.gems_reward})">Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteQuiz(${q.id})">Delete</button>
                </div>`;
            card.onclick=()=>selectQuiz(q.id);
            DOM.quizList.appendChild(card);
        });
    }
}
function editQuiz(id,title,gems){
    openForm("Edit Quiz",[
        {name:"title",label:"Quiz Title",value:title},
        {name:"gems_reward",label:"Gems Reward",type:"number",value:gems}
    ],async fd=>{
        await apiFetch(`/admin/quizzes/${id}`,"PUT",fd);
        await loadQuizzes(selectedSubjectId);
    });
}
DOM.addQuizBtn.onclick=()=>openForm("Add Quiz",[
    {name:"title",label:"Quiz Title"},
    {name:"gems_reward",label:"Gems Reward",type:"number"}
],async fd=>{
    fd.append("subject_id",selectedSubjectId);
    await apiFetch("/admin/quizzes","POST",fd);
    await loadQuizzes(selectedSubjectId);
});
async function deleteQuiz(id){ if(!confirm("Delete quiz?")) return; const res=await apiFetch(`/admin/quizzes/${id}`,"DELETE"); if(res.ok) await loadQuizzes(selectedSubjectId); }

// --- Questions ---
async function loadQuestions(quizId){
    const res=await apiFetch(`/admin/quiz_questions/${quizId}`);
    DOM.questionList.innerHTML="";
    if(res.ok && Array.isArray(res.questions)){
        res.questions.forEach(q=>{
            const card=document.createElement("div"); card.className="card";
            const questionText=q.text.length>70?q.text.slice(0,70)+"...":q.text;
            card.innerHTML=`
                <div class="card-details">
                    <div class="card-title">${questionText}</div>
                    <div>Reward: ${q.stars_reward} Stars</div>
                </div>
                <div>
                    <button class="btn btn-warning" onclick="event.stopPropagation(); editQuestion(${q.id})">Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteQuestion(${q.id})">Delete</button>
                </div>`;
            card.onclick=()=>{
                const existing=card.querySelector(".options-display"); if(existing){existing.remove(); return;}
                const optionsDiv=document.createElement("div"); optionsDiv.className="options-display";
                q.options.forEach((opt,idx)=>{ const optDiv=document.createElement("div"); optDiv.className=idx===q.correct_option_index?'correct-option':''; optDiv.textContent=`${idx+1}. ${opt} ${idx===q.correct_option_index?"(Correct)":""}`; optionsDiv.appendChild(optDiv); });
                card.appendChild(optionsDiv);
            };
            DOM.questionList.appendChild(card);
        });
    }
}
function createOptionsManager(options=["","","",""]){
    const wrapper=document.createElement('div'); wrapper.className='options-manager-group';
    const container=document.createElement('div'); container.id='options-container';
    const render=()=>{ container.innerHTML=""; options.forEach((opt,idx)=>{ const g=document.createElement("div"); g.className="form-group option-input-container"; const l=document.createElement("label"); l.textContent=`Option ${idx+1}`; l.htmlFor=`option_${idx}`; const i=document.createElement("input"); i.name=`option_${idx}`; i.value=opt; i.placeholder=`Text for Option ${idx+1}`; i.id=`option_${idx}`; g.appendChild(l); g.appendChild(i); container.appendChild(g); }); };
    const addOption=()=>{ options.push(""); render(); };
    const btn=document.createElement('button'); btn.textContent='+ Add Option'; btn.type='button'; btn.className='btn btn-add-option'; btn.onclick=addOption;
    render(); wrapper.appendChild(container); wrapper.appendChild(btn); return wrapper;
}
function extractOptionsPayload(formData){
    const options=[];
    for(let pair of formData.entries()){
        if(pair[0].startsWith("option_") && pair[1].trim()!=="") options.push(pair[1]);
    }
    const payload=new FormData();
    payload.append("question_text",formData.get("question_text"));
    options.forEach(o=>payload.append("options",o));
    payload.append("correct_option_index",formData.get("correct_option_index"));
    payload.append("stars_reward",formData.get("stars_reward"));
    payload.append("qtype","multiple");
    if(selectedQuizId) payload.append("quiz_id",selectedQuizId);
    return payload;
}

function createQuestionTypeSelect(selectedType = "mcq") {
    const group = document.createElement("div");
    group.className = "form-group";

    const label = document.createElement("label");
    label.textContent = "Question Type";
    label.htmlFor = "question_type";

    const select = document.createElement("select");
    select.name = "question_type";
    select.id = "question_type";

    ["mcq", "tf"].forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type === "mcq" ? "Multiple Choice (MCQ)" : "True / False (TF)";
        if (type === selectedType) option.selected = true;
        select.appendChild(option);
    });

    group.appendChild(label);
    group.appendChild(select);
    return group;
}

function editQuestion(id){
    apiFetch(`/admin/questions/${id}`).then(res=>{
        if(!res.ok) return;
        const q=res.question;
        const optionsManager = createOptionsManager(q.options);

        const fields=[
            {name:"question_text",label:"Question Text",type:"textarea",value:q.text},
            {name:"correct_option_index",label:"Correct Index (start from 0 -> last option)",type:"number",value:q.correct_option_index},
            {name:"stars_reward",label:"Stars Reward",type:"number",value:q.stars_reward}
        ];

        const typeSelect = createQuestionTypeSelect(q.qtype);

        openForm("Edit Question", fields, async fd=>{
            const payload = extractOptionsPayload(fd);
            payload.append("question_type", fd.get("question_type"));
            await apiFetch(`/admin/questions/${id}`, "PUT", payload);
            await loadQuestions(selectedQuizId);
        }, optionsManager);

        DOM.formFields.insertBefore(typeSelect, DOM.formFields.firstChild);
    });
}

DOM.addQuestionBtn.onclick = () => {
    const optionsManager = createOptionsManager(["",""]);
    const fields = [
        {name:"question_text",label:"Question Text",type:"textarea"},
        {name:"correct_option_index",label:"Correct Index",type:"number"},
        {name:"stars_reward",label:"Stars Reward",type:"number"}
    ];

    const typeSelect = createQuestionTypeSelect("mcq");

    openForm("Add Question", fields, async fd=>{
        const payload = extractOptionsPayload(fd);
        payload.append("quiz_id", selectedQuizId);
        payload.append("question_type", fd.get("question_type"));
        payload.append("qtype","multiple");
        await apiFetch("/admin/questions","POST",payload);
        await loadQuestions(selectedQuizId);
    }, optionsManager);

    DOM.formFields.insertBefore(typeSelect, DOM.formFields.firstChild);
};

async function deleteQuestion(id){ if(!confirm("Delete question?")) return; const res=await apiFetch(`/admin/questions/${id}`,"DELETE"); if(res.ok) await loadQuestions(selectedQuizId); }

// --- Select Handlers ---
async function selectSubject(id,title){ selectedSubjectId=id; selectedQuizId=null; DOM.quizzesTitle.textContent=`Quizzes for "${title}"`; DOM.addQuizBtn.classList.remove("hidden"); DOM.questionManagement.classList.add("hidden"); DOM.questionList.innerHTML=""; await loadSubjects(); await loadQuizzes(id); }
async function selectQuiz(id){ selectedQuizId=id; DOM.questionManagement.classList.remove("hidden"); await loadQuestions(id); }

// --- Initial Load ---
loadSubjects();