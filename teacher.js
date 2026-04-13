// SETU Faculty Dashboard Interactions

document.addEventListener("DOMContentLoaded", () => {
  const sessionActive = localStorage.getItem("setu_user_email");

  // Quick Actions and Upload Modals are handled dynamically at the bottom of the script

  // ── Dashboard Stats from DB ──────────────────────────────────────────────
  async function loadDashboardStats() {
    const email = localStorage.getItem("setu_user_email");
    if (!email) return;
    try {
      const res  = await fetch(`fetch_dashboard_stats.php?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!data.success) return;

      const el = id => document.getElementById(id);

      if (el("statTotalStudents"))  el("statTotalStudents").textContent  = data.total_students;
      if (el("statActiveSessions")) el("statActiveSessions").textContent = data.active_sessions;
      if (el("statUploadedContent"))el("statUploadedContent").textContent= data.uploaded_content;

      if (el("statStudentsSubtext"))
        el("statStudentsSubtext").textContent = data.total_students === 1 ? "1 registered" : `${data.total_students} registered`;
      if (el("statSessionsSubtext"))
        el("statSessionsSubtext").textContent = data.active_sessions > 0 ? `${data.active_sessions} live now` : "None live";
      if (el("statContentSubtext"))
        el("statContentSubtext").textContent = `${data.uploaded_content} file${data.uploaded_content !== 1 ? 's' : ''} uploaded`;
    } catch (e) {
      console.error("Stats load error:", e);
    }
  }
  loadDashboardStats();
  
  // ── Quiz Retake Requests ────────────────────────────────────────────────
  async function loadRetakeRequests() {
    const email = localStorage.getItem("setu_user_email");
    const container = document.getElementById("retakeRequestsTableBody");
    const badge = document.getElementById("retakeCountBadge");
    if (!email || !container) return;

    try {
      const res = await fetch("quiz_retake_handler.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ action: 'fetch_requests', email })
      });
      const data = await res.json();
      if (!data.success) return;

      const requests = data.requests || [];
      if (badge) {
        badge.textContent = requests.length;
        badge.style.display = requests.length > 0 ? "inline-block" : "none";
      }

      if (requests.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:20px;">No pending retake requests.</td></tr>`;
        return;
      }

      container.innerHTML = requests.map(r => {
        const scorePerc = r.total_questions > 0 ? Math.round((r.score / r.total_questions)*100) : 0;
        return `
          <tr>
            <td>
              <div style="font-weight:600; color:#0F172A;">${r.student_name}</div>
              <div style="font-size:11px; color:#64748B;">${r.student_email}</div>
            </td>
            <td><strong>${r.quiz_title}</strong></td>
            <td>${r.score} / ${r.total_questions} (${scorePerc}%)</td>
            <td>Just now</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button onclick="window._handleRetake(${r.quiz_id}, '${r.student_email}', 'approve_retake')"
                  style="background:#DCFCE7; color:#059669; border:none; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:600; cursor:pointer;">Approve</button>
                <button onclick="window._handleRetake(${r.quiz_id}, '${r.student_email}', 'reject_retake')"
                  style="background:#FEE2E2; color:#DC2626; border:none; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:600; cursor:pointer;">Ignore</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch(e) { console.error("Retake requests load fail:", e); }
  }
  
  window._handleRetake = async (quizId, studentEmail, action) => {
    const email = localStorage.getItem("setu_user_email"); // teacher email
    try {
      const res = await fetch("quiz_retake_handler.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ action, quiz_id: quizId, student_email: studentEmail, email })
      });
      const data = await res.json();
      if (data.success) {
        loadRetakeRequests();
        alert(action === 'approve_retake' ? "Retake approved! Student can now restart the quiz." : "Request ignored.");
      } else { alert("Action failed: " + data.error); }
    } catch(e) { alert("Network error."); }
  };

  loadRetakeRequests();
  // ────────────────────────────────────────────────────────────────────────

  // ── Live Classes Sidebar Accordion ──────────────────────────────────────
  const liveClassesToggle = document.getElementById("liveClassesToggle");
  const liveClassesPanel  = document.getElementById("liveClassesPanel");
  const liveClassesList   = document.getElementById("liveClassesList");
  const liveCountBadge    = document.getElementById("liveCountBadge");

  async function loadLiveClassesSidebar() {
    const email = localStorage.getItem("setu_user_email");
    if (!email || !liveClassesList) return;
    try {
      const res  = await fetch(`fetch_quick_data.php?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!data.success) return;

      // fetch_quick_data only returns the current live session; we need all of them
      // so we query fetch_all_live.php (created below) instead
      const res2  = await fetch(`fetch_all_live.php?email=${encodeURIComponent(email)}`);
      const data2 = await res2.json();

      const sessions = data2.sessions || [];
      liveCountBadge.textContent = sessions.length;
      liveCountBadge.style.background = sessions.length > 0 ? "#EF4444" : "#94A3B8";

      if (sessions.length === 0) {
        liveClassesList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No live sessions yet.</p>`;
        return;
      }

      liveClassesList.innerHTML = sessions.map(s => {
        const href   = s.session_link ? s.session_link : "#";
        const target = s.session_link ? ' target="_blank" rel="noopener"' : "";
        const badge  = s.status === "Live"
          ? `<span style="background:#FEE2E2;color:#EF4444;border-radius:6px;padding:1px 6px;font-size:10px;font-weight:600;">LIVE</span>`
          : `<span style="background:#F1F5F9;color:#64748B;border-radius:6px;padding:1px 6px;font-size:10px;">Ended</span>`;
        const safeTitle = (s.session_title||'').replace(/'/g, "\\'");
        return `
          <div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
            <a href="${href}"${target} class="live-session-link" style="flex:1;">
              <div class="live-dot" style="background:${s.status === 'Live' ? '#EF4444' : '#94A3B8'};"></div>
              <div class="session-meta">
                <strong>${s.session_title}</strong>${badge}
                ${s.session_link ? `<span>${s.session_link.replace(/https?:\/\//, '').substring(0, 30)}…</span>` : '<span style="color:#94A3B8;">No link provided</span>'}
              </div>
            </a>
            <button onclick="window._deleteLiveSession(${s.id},'${safeTitle}')"
              style="background:#FEE2E2;color:#DC2626;border:none;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;flex-shrink:0;margin-top:4px;" title="Delete session">🗑️</button>
          </div>`;
      }).join('');

      // Auto-open panel if there are live sessions
      if (sessions.some(s => s.status === "Live")) {
        liveClassesPanel.style.display = "block";
      }
    } catch (e) {
      console.error("Live classes sidebar error:", e);
    }
  }

  if (liveClassesToggle) {
    liveClassesToggle.addEventListener("click", () => {
      const isOpen = liveClassesPanel.style.display !== "none";
      liveClassesPanel.style.display = isOpen ? "none" : "block";
    });
  }

  window._deleteLiveSession = async (id, title) => {
    if (!confirm(`Delete live session "${title}"? This cannot be undone.`)) return;
    const email = localStorage.getItem("setu_user_email");
    try {
      const res  = await fetch("delete_live_session.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id, email })
      });
      const data = await res.json();
      if (data.success) {
        loadLiveClassesSidebar();
        loadQuickData();
      } else { alert("Delete failed: " + data.error); }
    } catch(e) { alert("Network error deleting session."); }
  };

  loadLiveClassesSidebar();

  // ── Recorded Sessions Sidebar Accordion ─────────────────────────────────
  const recordedToggle      = document.getElementById("recordedToggle");
  const recordedPanel       = document.getElementById("recordedPanel");
  const recordedList        = document.getElementById("recordedList");
  const recordedCountBadge  = document.getElementById("recordedCountBadge");

  async function loadRecordedSessionsSidebar() {
    const email = localStorage.getItem("setu_user_email");
    if (!email || !recordedList) return;
    try {
      const res  = await fetch(`fetch_recorded_sessions.php?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      const videos = data.videos || [];
      recordedCountBadge.textContent = videos.length;
      recordedCountBadge.style.background = videos.length > 0 ? "#D97706" : "#94A3B8";

      if (videos.length === 0) {
        recordedList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No recorded sessions uploaded yet.</p>`;
        return;
      }

      recordedList.innerHTML = videos.map(v => {
        const mb      = (v.file_size_bytes / (1024 * 1024)).toFixed(2);
        const dateStr = new Date(v.uploaded_at).toLocaleDateString();
        // Direct link to serve the file from the uploads folder
        const href    = `uploads/${v.stored_filename}`;
        return `
          <a href="${href}" target="_blank" rel="noopener" class="recorded-session-link">
            <div class="rec-dot"></div>
            <div class="rec-meta">
              <strong>${v.original_filename}</strong>
              <span>${mb} MB &bull; ${dateStr}</span>
            </div>
          </a>`;
      }).join('');

    } catch (e) {
      console.error("Recorded sessions sidebar error:", e);
    }
  }

  if (recordedToggle) {
    recordedToggle.addEventListener("click", () => {
      const isOpen = recordedPanel.style.display !== "none";
      recordedPanel.style.display = isOpen ? "none" : "block";
    });
  }

  loadRecordedSessionsSidebar();

  // ── Quizzes Sidebar Accordion ───────────────────────────────────────────
  const quizzesToggle     = document.getElementById("quizzesToggle");
  const quizzesPanel      = document.getElementById("quizzesPanel");
  const quizzesList       = document.getElementById("quizzesList");
  const quizzesCountBadge = document.getElementById("quizzesCountBadge");

  // Edit Quiz modal elements
  const editQuizModal        = document.getElementById("editQuizModal");
  const closeEditQuizBtn     = document.getElementById("closeEditQuizBtn");
  const cancelEditQuizBtn    = document.getElementById("cancelEditQuizBtn");
  const saveEditQuizBtn      = document.getElementById("saveEditQuizBtn");
  const editQuizTitle        = document.getElementById("editQuizTitle");
  const editQuizDuration     = document.getElementById("editQuizDuration");
  const editQuizSubtitle     = document.getElementById("editQuizSubtitle");
  const editQuestionsContainer = document.getElementById("editQuestionsContainer");
  const addEditQuestionBtn   = document.getElementById("addEditQuestionBtn");

  let editingQuizId = null;
  let editQuizCardCount = 0;

  function buildEditQuestionCard(q = {}, idx) {
    const div = document.createElement("div");
    div.dataset.editCard = idx;
    div.style.cssText = "background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px;position:relative;";
    div.innerHTML = `
      <button onclick="this.closest('[data-edit-card]').remove();"
        style="position:absolute;top:10px;right:12px;background:none;border:none;color:#EF4444;font-size:15px;cursor:pointer;" title="Remove">✕</button>
      <p style="font-size:13px;font-weight:600;color:#4F46E5;margin-bottom:10px;">Question ${idx}</p>
      <div class="form-group">
        <label>Question Text</label>
        <input type="text" class="form-input eq-text" value="${(q.question_text||'').replace(/"/g,'&quot;')}" placeholder="Enter question">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
        <div class="form-group"><label>Option A</label><input type="text" class="form-input eq-opt-a" value="${(q.option_a||'').replace(/"/g,'&quot;')}" placeholder="Option A"></div>
        <div class="form-group"><label>Option B</label><input type="text" class="form-input eq-opt-b" value="${(q.option_b||'').replace(/"/g,'&quot;')}" placeholder="Option B"></div>
        <div class="form-group"><label>Option C</label><input type="text" class="form-input eq-opt-c" value="${(q.option_c||'').replace(/"/g,'&quot;')}" placeholder="Option C (optional)"></div>
        <div class="form-group"><label>Option D</label><input type="text" class="form-input eq-opt-d" value="${(q.option_d||'').replace(/"/g,'&quot;')}" placeholder="Option D (optional)"></div>
      </div>
      <div class="form-group" style="margin-top:8px;">
        <label>Correct Answer</label>
        <select class="form-input eq-correct">
          ${['A','B','C','D'].map(l=>`<option value="${l}" ${(q.correct_option||'A')===l?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-top:8px;">
        <label>Solution / Explanation</label>
        <textarea class="form-input eq-explanation" rows="2" placeholder="Explain the correct answer...">${q.explanation||''}</textarea>
      </div>`;
    return div;
  }

  function openEditQuizModal(quiz) {
    editingQuizId = quiz.id;
    editQuizTitle.value    = quiz.quiz_title;
    editQuizDuration.value = quiz.duration_mins;
    editQuizSubtitle.textContent = `Editing: ${quiz.quiz_title}`;
    editQuestionsContainer.innerHTML = "";
    editQuizCardCount = 0;

    if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions.forEach(q => {
        editQuizCardCount++;
        editQuestionsContainer.appendChild(buildEditQuestionCard(q, editQuizCardCount));
      });
    } else {
      editQuizCardCount++;
      editQuestionsContainer.appendChild(buildEditQuestionCard({}, editQuizCardCount));
    }
    editQuizModal.classList.add("active");
  }

  const closeEditQuizModal = () => { editQuizModal.classList.remove("active"); editingQuizId = null; };
  if (closeEditQuizBtn)  closeEditQuizBtn.addEventListener("click", closeEditQuizModal);
  if (cancelEditQuizBtn) cancelEditQuizBtn.addEventListener("click", closeEditQuizModal);

  if (addEditQuestionBtn) {
    addEditQuestionBtn.addEventListener("click", () => {
      editQuizCardCount++;
      const card = buildEditQuestionCard({}, editQuizCardCount);
      editQuestionsContainer.appendChild(card);
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (saveEditQuizBtn) {
    saveEditQuizBtn.addEventListener("click", async () => {
      const email    = localStorage.getItem("setu_user_email");
      const title    = editQuizTitle.value.trim();
      const duration = parseInt(editQuizDuration.value);
      if (!title || !duration) { alert("Title and duration are required."); return; }

      const cards = editQuestionsContainer.querySelectorAll("[data-edit-card]");
      if (cards.length === 0) { alert("Add at least one question."); return; }

      const questions = [];
      let valid = true;
      cards.forEach(card => {
        const qtext   = card.querySelector(".eq-text").value.trim();
        const opt_a   = card.querySelector(".eq-opt-a").value.trim();
        const opt_b   = card.querySelector(".eq-opt-b").value.trim();
        const opt_c   = card.querySelector(".eq-opt-c").value.trim();
        const opt_d   = card.querySelector(".eq-opt-d").value.trim();
        const correct = card.querySelector(".eq-correct").value;
        const expl    = card.querySelector(".eq-explanation").value.trim();
        if (!qtext || !opt_a || !opt_b) { alert("Each question needs text, Option A and B."); valid = false; return; }
        questions.push({ question_text: qtext, option_a: opt_a, option_b: opt_b, option_c: opt_c, option_d: opt_d, correct_option: correct, explanation: expl });
      });
      if (!valid) return;

      saveEditQuizBtn.textContent = "Saving...";
      saveEditQuizBtn.disabled = true;
      try {
        const res  = await fetch("update_quiz.php", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ quiz_id: editingQuizId, email, title, duration, questions })
        });
        const data = await res.json();
        if (data.success) {
          closeEditQuizModal();
          loadQuizzesSidebar();
          loadQuickData();
          alert("Quiz updated successfully!");
        } else { alert("Error: " + data.error); }
      } catch(e) { alert("Network error saving quiz."); }
      saveEditQuizBtn.textContent = "💾 Save Changes";
      saveEditQuizBtn.disabled = false;
    });
  }

  async function loadQuizzesSidebar() {
    const email = localStorage.getItem("setu_user_email");
    if (!email || !quizzesList) return;
    try {
      const res  = await fetch(`fetch_quizzes_sidebar.php?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const quizzes = data.quizzes || [];

      quizzesCountBadge.textContent = quizzes.length;
      quizzesCountBadge.style.background = quizzes.length > 0 ? "#059669" : "#94A3B8";

      if (quizzes.length === 0) {
        quizzesList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No quizzes yet.</p>`;
        return;
      }

      quizzesList.innerHTML = quizzes.map(quiz => {
        const qCount  = quiz.questions.length;
        const dateStr = new Date(quiz.created_at).toLocaleDateString();
        const qList   = qCount > 0
          ? quiz.questions.map((q, i) =>
              `<p style="font-size:11px;color:#64748B;padding:2px 0 2px 8px;border-left:2px solid #E2E8F0;">
                <strong>Q${i+1}:</strong> ${q.question_text.substring(0,50)}${q.question_text.length>50?'…':''}
              </p>`).join('')
          : `<p style="font-size:11px;color:#94A3B8;padding:2px 0 2px 8px;">No questions added yet.</p>`;

        return `
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="flex:1;">
                <strong style="font-size:13px;color:#0F172A;">${quiz.quiz_title}</strong>
                <span style="font-size:10px;color:#94A3B8;display:block;">${quiz.duration_mins} mins &bull; ${dateStr} &bull; ${qCount} Q</span>
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0;margin-left:6px;">
                <button onclick="window._editQuiz(${quiz.id})"
                  style="background:#EEF2FF;color:#4F46E5;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;">✏️ Edit</button>
                <button onclick="window._deleteQuiz(${quiz.id},'${quiz.quiz_title.replace(/'/g,"\\'")}')"
                  style="background:#FEE2E2;color:#DC2626;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;">🗑️</button>
              </div>
            </div>
            <div style="margin-top:8px;">${qList}</div>
          </div>`;
      }).join('');

      // Expose data for the edit button onclick
      window._quizzesCache = quizzes;
    } catch (e) { console.error("Quizzes sidebar error:", e); }
  }

  // Global functions called by inline onclicks
  window._editQuiz = (id) => {
    const quiz = (window._quizzesCache || []).find(q => q.id === id);
    if (quiz) openEditQuizModal(quiz);
  };

  window._deleteQuiz = async (id, title) => {
    if (!confirm(`Delete quiz "${title}" and all its questions? This cannot be undone.`)) return;
    const email = localStorage.getItem("setu_user_email");
    try {
      const res  = await fetch("delete_quiz.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ quiz_id: id, email })
      });
      const data = await res.json();
      if (data.success) {
        loadQuizzesSidebar();
        loadQuickData();
      } else { alert("Delete failed: " + data.error); }
    } catch(e) { alert("Network error deleting quiz."); }
  };

  if (quizzesToggle) {
    quizzesToggle.addEventListener("click", () => {
      const isOpen = quizzesPanel.style.display !== "none";
      quizzesPanel.style.display = isOpen ? "none" : "block";
    });
  }

  loadQuizzesSidebar();
  // ────────────────────────────────────────────────────────────────────────

  // Profile Edit Modal Logic
  const welcomeName = document.getElementById("welcomeName");
  const profileName = document.getElementById("profileName");
  const profileDepartment = document.getElementById("profileDepartment");
  
  const editProfileBtn = document.getElementById("editProfileBtn");
  const profileModal = document.getElementById("profileModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  
  const editNameInput = document.getElementById("editNameInput");
  const editDepartmentInput = document.getElementById("editDepartmentInput");

  // Load saved data
  const savedTeacherName = localStorage.getItem("setu_teacher_name");
  const savedTeacherDept = localStorage.getItem("setu_teacher_dept");
  const savedTeacherEmpId = localStorage.getItem("setu_teacher_emp_id");
  const avatar = document.querySelector(".profile-badge .avatar");
  
  if(savedTeacherName) {
    if(welcomeName) welcomeName.textContent = savedTeacherName;
    if(profileName) profileName.textContent = savedTeacherName;
    if(avatar) avatar.textContent = savedTeacherName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  }
  
  const liveSessionTitle = document.getElementById("liveSessionTitle");
  const dynamicQuizActivity = document.getElementById("dynamicQuizActivity");

  if(savedTeacherDept) {
    if(profileDepartment) profileDepartment.textContent = savedTeacherDept;
  }
  
  const profileEmpId = document.getElementById("profileEmpId");
  if(savedTeacherEmpId && profileEmpId) {
    profileEmpId.textContent = savedTeacherEmpId;
  }

  // Open Modal
  const openModal = () => {
    if(editNameInput && profileName) editNameInput.value = profileName.textContent;
    if(editDepartmentInput && profileDepartment) editDepartmentInput.value = profileDepartment.textContent;
    if(profileModal) profileModal.classList.add("active");
  };

  // Close Modal
  const closeModal = () => {
    if(profileModal) profileModal.classList.remove("active");
  };

  if(editProfileBtn) editProfileBtn.addEventListener("click", openModal);
  if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if(cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  
  // Save Profile Database Hook
  if(saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const newName = editNameInput.value.trim();
      const newDept = editDepartmentInput.value.trim();
      const email = localStorage.getItem("setu_user_email");

      if(!email) {
          alert("Session active footprint missing. Please re-login!");
          return;
      }

      const saveBtnOriginalText = saveProfileBtn.textContent;
      saveProfileBtn.textContent = "Saving...";
      saveProfileBtn.disabled = true;

      const finalName = newName || savedTeacherName;
      const finalDept = newDept || savedTeacherDept;

      try {
          const res = await fetch("update_profile.php", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ email: email, fullname: finalName, subject: finalDept })
          });
          const data = await res.json();
          
          if(data.success) {
              if(newName) {
                if(welcomeName) welcomeName.textContent = newName;
                if(profileName) profileName.textContent = newName;
                if(avatar) avatar.textContent = newName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                localStorage.setItem("setu_teacher_name", newName);
              }
              
              if(newDept) {
                if(profileDepartment) profileDepartment.textContent = newDept;
                localStorage.setItem("setu_teacher_dept", newDept);
              }
              
              closeModal();
              // Optional silent sync or tiny graphical ping indicating database connection successfully updated row!
          } else {
              alert("Error linking database update: " + data.error);
          }
      } catch(err) {
          console.error(err);
          alert("Network execution failure checking Database.");
      } finally {
          saveProfileBtn.textContent = saveBtnOriginalText;
          saveProfileBtn.disabled = false;
      }
    });
  }

  // Load dynamically edited student data into the Student Records Table
  const savedStudentName = localStorage.getItem("setu_student_name");
  const savedStudentClass = localStorage.getItem("setu_student_class");
  const savedStudentRoll = localStorage.getItem("setu_student_roll");
  
  if (savedStudentName) {
    const tableBody = document.getElementById("studentRecordsTableBody");
    if(tableBody && tableBody.rows.length > 0) {
      const firstRow = tableBody.rows[0];
      const nameStrong = firstRow.querySelector("strong");
      const classTd = firstRow.cells[1];
      const rollTd = firstRow.cells[2];
      const avatarDiv = firstRow.querySelector(".avatar");

      if (nameStrong) nameStrong.textContent = savedStudentName;
      if (avatarDiv) {
        // Compute new initials
        const initials = savedStudentName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        avatarDiv.textContent = initials;
      }
      if (classTd && savedStudentClass) classTd.textContent = savedStudentClass;
      if (rollTd && savedStudentRoll) rollTd.textContent = savedStudentRoll.replace("Roll No: ", "").trim();
    }
  }

  // File Upload Logic Architecture
  const uploadDropzone = document.getElementById("uploadDropzone");
  const hiddenFileInput = document.getElementById("hiddenFileInput");
  const uploadBrowseBtn = document.getElementById("uploadBrowseBtn");
  const uploadStatusText = document.getElementById("uploadStatusText");
  const dynamicContentList = document.getElementById("dynamicContentList");

  if(uploadDropzone && hiddenFileInput) {
      uploadDropzone.addEventListener("click", () => hiddenFileInput.click());
      
      uploadDropzone.addEventListener("dragover", (e) => {
          e.preventDefault();
          uploadDropzone.style.borderColor = "#2563EB";
          uploadDropzone.style.backgroundColor = "#EFF6FF";
      });
      uploadDropzone.addEventListener("dragleave", (e) => {
          e.preventDefault();
          uploadDropzone.style.borderColor = "#E2E8F0";
          uploadDropzone.style.backgroundColor = "#F8FAFC";
      });
      uploadDropzone.addEventListener("drop", (e) => {
          e.preventDefault();
          uploadDropzone.style.borderColor = "#E2E8F0";
          uploadDropzone.style.backgroundColor = "#F8FAFC";
          if(e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
      });

      hiddenFileInput.addEventListener("change", (e) => {
          if(e.target.files.length > 0) handleFiles(e.target.files);
      });

      async function handleFiles(files) {
          const email = localStorage.getItem("setu_user_email");
          if(!email) { alert("Session expired!"); return; }

          const file = files[0];
          uploadStatusText.innerHTML = `<strong>Uploading ${file.name}...</strong>`;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("email", email);

          try {
              const res = await fetch("upload_file.php", {
                  method: "POST",
                  body: formData
              });
              const data = await res.json();
              if(data.success) {
                  uploadStatusText.innerHTML = `<strong style="color:#059669;">Success! Uploaded!</strong>`;
                  setTimeout(()=> {
                      uploadStatusText.innerHTML = `<strong>Drag and drop files here</strong>`;
                  }, 3000);
                  loadUploadedFiles();
              } else {
                  alert(data.error);
                  uploadStatusText.innerHTML = `<strong style="color:#EF4444;">Upload Failed!</strong>`;
              }
          } catch (e) {
              alert("Server upload failed! Permission mapped.");
              uploadStatusText.innerHTML = `<strong>Drag and drop files here</strong>`;
          }
      }
  }

  window.deleteFile = async (id) => {
      if(!confirm("Are you sure you want to completely delete this content permanently?")) return;
      const email = localStorage.getItem("setu_user_email");
      try {
          const res = await fetch("delete_file.php", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({id, email})
          });
          const data = await res.json();
          if(data.success) {
              loadUploadedFiles();
          } else { alert("Failed removing content mapping: " + data.error); }
      } catch(e){ alert("Native tracking errors isolated."); }
  };

  async function loadUploadedFiles() {
      const email = localStorage.getItem("setu_user_email");
      if(!email || !dynamicContentList) return;

      try {
          const res = await fetch(`fetch_uploads.php?email=${encodeURIComponent(email)}`);
          const data = await res.json();
          
          if(data.success) {
              dynamicContentList.innerHTML = "";
              if(data.files.length === 0) {
                  dynamicContentList.innerHTML = `<p style="padding:20px; color:#94A3B8; text-align:center;">No files uploaded yet.</p>`;
                  return;
              }
              
              data.files.forEach(f => {
                  let icon = "📄"; let color = "#4F46E5"; let bg = "#E0E7FF";
                  let typetxt = "Document Module";
                  if(f.file_type.includes("video") || f.original_filename.includes(".mp4")) { icon = "🎥"; color = "#D97706"; bg = "#FEF3C7"; typetxt = "Video Session"; }
                  else if(f.file_type.includes("pdf") || f.original_filename.includes(".pdf")) { icon = "📕"; color = "#EF4444"; bg = "#FEE2E2"; typetxt = "PDF Document"; }
                  
                  const mbSize = (f.file_size_bytes / (1024*1024)).toFixed(2);
                  const dateOpts = new Date(f.uploaded_at).toLocaleDateString();

                  dynamicContentList.innerHTML += `
                    <div class="content-card">
                      <div class="content-thumb" style="background: ${bg}; color: ${color};">${icon}</div>
                      <div class="content-info">
                        <h4>${f.original_filename}</h4>
                        <p style="color:#64748B; font-size:13px; margin-top:5px;">${typetxt} • Uploaded By You</p>
                      </div>
                      <div class="content-meta">
                        <span>${dateOpts}</span>
                        <strong>${mbSize} MB</strong>
                      </div>
                      <div style="display:flex; gap:8px; margin-left:15px;">
                         <button class="secondary-btn-sm" style="padding:6px 12px; font-size:12px; color:#EF4444; border-color:#FECACA;" onclick="deleteFile(${f.id})">Delete</button>
                      </div>
                    </div>
                  `;
              });
          }
      } catch(e) { console.error(e); }
      
      // Sequentially load quick action UI datasets seamlessly merging arrays!
      loadQuickData();
  }

  // Quick Actions Interactivity Integrations
  const btnUploadSlides = document.getElementById("btnUploadSlides");
  const btnUploadLecture = document.getElementById("btnUploadLecture");
  if(btnUploadSlides) btnUploadSlides.addEventListener("click", () => hiddenFileInput.click());
  if(btnUploadLecture) btnUploadLecture.addEventListener("click", () => hiddenFileInput.click());

  const btnLiveSession = document.getElementById("btnLiveSession");
  const liveSessionModal = document.getElementById("liveSessionModal");
  const closeLiveModalBtn = document.getElementById("closeLiveModalBtn");
  const cancelLiveModalBtn = document.getElementById("cancelLiveModalBtn");
  const startLiveBtn = document.getElementById("startLiveBtn");
  const liveTitleInput = document.getElementById("liveTitleInput");
  const liveLinkInput = document.getElementById("liveLinkInput");

  const closeLiveModal = () => liveSessionModal.classList.remove("active");
  if (btnLiveSession) btnLiveSession.addEventListener("click", () => {
    liveTitleInput.value = ""; liveLinkInput.value = "";
    liveSessionModal.classList.add("active");
  });
  if (closeLiveModalBtn) closeLiveModalBtn.addEventListener("click", closeLiveModal);
  if (cancelLiveModalBtn) cancelLiveModalBtn.addEventListener("click", closeLiveModal);
  if (startLiveBtn) {
    startLiveBtn.addEventListener("click", async () => {
      const title = liveTitleInput.value.trim();
      const link  = liveLinkInput.value.trim();
      const email = localStorage.getItem("setu_user_email");
      if (!title) { alert("Please enter a session title!"); return; }
      startLiveBtn.textContent = "Deploying..."; startLiveBtn.disabled = true;
      try {
        const res  = await fetch("quick_actions.php", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ action: "start_live", email, title, link })
        });
        const data = await res.json();
        if (data.success) { closeLiveModal(); loadQuickData(); loadLiveClassesSidebar(); }
        else { alert("Error: " + data.error); }
      } catch(e) { alert("Network error starting live session."); }
      startLiveBtn.textContent = "Go Live Now"; startLiveBtn.disabled = false;
    });
  }

  const quizModal          = document.getElementById("quizModal");
  const closeQuizModalBtn  = document.getElementById("closeQuizModalBtn");
  const cancelQuizModalBtn = document.getElementById("cancelQuizModalBtn");
  const postQuizSubmitBtn  = document.getElementById("postQuizSubmitBtn");
  const quizTitleInput     = document.getElementById("quizTitleInput");
  const quizDurationInput  = document.getElementById("quizDurationInput");
  const quizNextBtn        = document.getElementById("quizNextBtn");
  const quizStep1          = document.getElementById("quizStep1");
  const quizStep2          = document.getElementById("quizStep2");
  const quizModalStep      = document.getElementById("quizModalStep");
  const questionsContainer = document.getElementById("questionsContainer");
  const addQuestionBtn     = document.getElementById("addQuestionBtn");
  const btnAIUpload        = document.getElementById("btnAIUpload");
  const aiQuizFileInput    = document.getElementById("aiQuizFileInput");
  const aiLoadingStatus    = document.getElementById("aiLoadingStatus");

  let quizQuestionCount = 0;

  function addQuestionCard(qData = null) {
    quizQuestionCount++;
    const idx = quizQuestionCount;
    const card = document.createElement("div");
    card.id = `qcard-${idx}`;
    card.style.cssText = "background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;position:relative;";
    
    const qText = qData ? qData.question_text : "";
    const optA  = qData ? qData.option_a : "";
    const optB  = qData ? qData.option_b : "";
    const optC  = qData ? qData.option_c : "";
    const optD  = qData ? qData.option_d : "";
    const correct = qData ? qData.correct_option : "A";
    const expl  = qData ? qData.explanation : "";

    card.innerHTML = `
      <button onclick="document.getElementById('qcard-${idx}').remove();"
        style="position:absolute;top:10px;right:12px;background:none;border:none;color:#EF4444;font-size:16px;cursor:pointer;" title="Remove">✕</button>
      <p style="font-size:13px;font-weight:600;color:#4F46E5;margin-bottom:10px;">Question ${idx}</p>
      <div class="form-group">
        <label>Question Text</label>
        <input type="text" class="form-input q-text" placeholder="e.g. What is Newton's 2nd law?" value="${qText.replace(/"/g, '&quot;')}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
        <div class="form-group"><label>Option A</label><input type="text" class="form-input q-opt-a" placeholder="Option A" value="${optA.replace(/"/g, '&quot;')}"></div>
        <div class="form-group"><label>Option B</label><input type="text" class="form-input q-opt-b" placeholder="Option B" value="${optB.replace(/"/g, '&quot;')}"></div>
        <div class="form-group"><label>Option C (optional)</label><input type="text" class="form-input q-opt-c" placeholder="Option C" value="${optC.replace(/"/g, '&quot;')}"></div>
        <div class="form-group"><label>Option D (optional)</label><input type="text" class="form-input q-opt-d" placeholder="Option D" value="${optD.replace(/"/g, '&quot;')}"></div>
      </div>
      <div class="form-group" style="margin-top:8px;">
        <label>Correct Answer</label>
        <select class="form-input q-correct">
          ${['A','B','C','D'].map(l=>`<option value="${l}" ${correct===l?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-top:8px;">
        <label>Solution / Explanation</label>
        <textarea class="form-input q-explanation" rows="2" placeholder="Explain the correct answer...">${expl}</textarea>
      </div>
    `;
    questionsContainer.appendChild(card);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // AI Upload Handling
  if (btnAIUpload && aiQuizFileInput) {
    btnAIUpload.addEventListener("click", () => {
      console.log("AI Upload button clicked");
      aiQuizFileInput.click();
    });
    
    aiQuizFileInput.addEventListener("change", async (e) => {
      console.log("File input changed", e.target.files);
      const file = e.target.files[0];
      if (!file) {
        console.warn("No file selected");
        return;
      }

      const title = quizTitleInput.value.trim();
      if (!title) { 
        alert("Please provide a Quiz Title first so AI can contextualize!"); 
        e.target.value=""; 
        return; 
      }

      console.log(`Starting AI processing for file: ${file.name}, Title: ${title}`);
      aiLoadingStatus.style.display = "block";
      btnAIUpload.disabled = true;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("process_ai_quiz.php", {
          method: "POST",
          body: formData
        });
        
        console.log("Response received from process_ai_quiz.php", res);
        const data = await res.json();
        console.log("Data parsed:", data);

        if (data.success && data.questions) {
          console.log(`Successfully generated ${data.questions.length} questions`);
          // Transition to Step 2
          quizStep1.style.display = "none";
          quizStep2.style.display = "flex";
          quizNextBtn.style.display = "none";
          postQuizSubmitBtn.style.display = "inline-flex";
          quizModalStep.textContent = "Step 2 of 2 — AI Generated Questions Review";
          
          questionsContainer.innerHTML = "";
          quizQuestionCount = 0;
          
          data.questions.forEach(q => addQuestionCard(q));
          alert(`Successfully generated ${data.questions.length} questions from your document!`);
        } else {
          console.error("AI Generation Error:", data.error, data.details);
          alert("AI Parsing failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Network Error during AI processing:", err);
        alert("Network error processing document with AI. Check console for details.");
      } finally {
        aiLoadingStatus.style.display = "none";
        btnAIUpload.disabled = false;
        e.target.value = ""; // reset file input
      }
    });
  }

  function resetQuizModal() {
    quizTitleInput.value = "";
    quizDurationInput.value = "";
    quizStep1.style.display = "block";
    quizStep2.style.display = "none";
    quizNextBtn.style.display = "inline-flex";
    postQuizSubmitBtn.style.display = "none";
    quizModalStep.textContent = "Step 1 of 2 — Quiz Details";
    questionsContainer.innerHTML = "";
    quizQuestionCount = 0;
  }

  const closeQuizModal = () => { quizModal.classList.remove("active"); resetQuizModal(); };
  if (closeQuizModalBtn) closeQuizModalBtn.addEventListener("click", closeQuizModal);
  if (cancelQuizModalBtn) cancelQuizModalBtn.addEventListener("click", closeQuizModal);

  if (btnPostQuiz) btnPostQuiz.addEventListener("click", () => {
    resetQuizModal();
    quizModal.classList.add("active");
  });

  // Step 1 → Step 2
  if (quizNextBtn) {
    quizNextBtn.addEventListener("click", () => {
      const title    = quizTitleInput.value.trim();
      const duration = quizDurationInput.value.trim();
      if (!title || !duration) { alert("Please fill in the quiz title and duration first."); return; }
      quizStep1.style.display = "none";
      quizStep2.style.display = "flex";
      quizNextBtn.style.display = "none";
      postQuizSubmitBtn.style.display = "inline-flex";
      quizModalStep.textContent = "Step 2 of 2 — Add Questions";
      addQuestionCard(); // seed with one empty card
    });
  }

  if (addQuestionBtn) addQuestionBtn.addEventListener("click", addQuestionCard);

  // Final deploy: create quiz then save all questions
  if (postQuizSubmitBtn) {
    postQuizSubmitBtn.addEventListener("click", async () => {
      const title    = quizTitleInput.value.trim();
      const duration = quizDurationInput.value.trim();
      const email    = localStorage.getItem("setu_user_email");

      const cards = questionsContainer.querySelectorAll("[id^='qcard-']");
      if (cards.length === 0) { alert("Please add at least one question."); return; }

      const questions = [];
      let valid = true;
      cards.forEach(card => {
        const qtext   = card.querySelector(".q-text").value.trim();
        const opt_a   = card.querySelector(".q-opt-a").value.trim();
        const opt_b   = card.querySelector(".q-opt-b").value.trim();
        const opt_c   = card.querySelector(".q-opt-c").value.trim();
        const opt_d   = card.querySelector(".q-opt-d").value.trim();
        const correct = card.querySelector(".q-correct").value;
        const expl    = card.querySelector(".q-explanation").value.trim();
        if (!qtext || !opt_a || !opt_b) { alert("Every question needs text, Option A, and Option B."); valid = false; return; }
        questions.push({ question_text: qtext, option_a: opt_a, option_b: opt_b, option_c: opt_c, option_d: opt_d, correct_option: correct, explanation: expl });
      });
      if (!valid) return;

      postQuizSubmitBtn.textContent = "Deploying...";
      postQuizSubmitBtn.disabled = true;

      try {
        // Step 1: create quiz record and get its ID
        const r1   = await fetch("quick_actions.php", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ action: "post_quiz", email, title, duration })
        });
        const d1 = await r1.json();
        if (!d1.success) { alert("Failed to create quiz: " + d1.error); return; }

        const quiz_id = d1.quiz_id;

        // Step 2: save questions
        const r2   = await fetch("save_quiz_questions.php", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ quiz_id, email, questions })
        });
        const d2 = await r2.json();
        if (d2.success) {
          closeQuizModal();
          loadQuickData();
          alert(`Quiz deployed with ${d2.saved} question(s) saved!`);
        } else {
          alert("Quiz created but questions failed: " + d2.error);
        }
      } catch(e) {
        alert("Network error during quiz deployment.");
      }
      postQuizSubmitBtn.textContent = "🚀 Deploy Quiz";
      postQuizSubmitBtn.disabled = false;
    });
  }

  async function loadQuickData() {
      const email = localStorage.getItem("setu_user_email");
      if(!email) return;
      try {
          const res = await fetch(`fetch_quick_data.php?email=${encodeURIComponent(email)}`);
          const data = await res.json();
          if(data.success) {
              const liveSessionTitle = document.getElementById("liveSessionTitle");
              const liveIndicator = document.querySelector(".live-indicator");
              if(data.live) {
                  if(liveSessionTitle) liveSessionTitle.textContent = data.live.session_title;
                  if(liveIndicator) liveIndicator.style.display = "flex";
              } else {
                  if(liveSessionTitle) liveSessionTitle.textContent = "No Live Sessions Configured";
                  if(liveIndicator) liveIndicator.style.display = "none";
              }

              const dynamicContentList = document.getElementById("dynamicContentList");
              if(dynamicContentList && data.quizzes) {
                  document.querySelectorAll(".quiz-card-dynamic").forEach(e => e.remove());
                  data.quizzes.forEach(q => {
                      const dateOpts = new Date(q.created_at).toLocaleDateString();
                      dynamicContentList.innerHTML += `
                        <div class="content-card quiz-card-dynamic">
                          <div class="content-thumb" style="background: #DCFCE7; color: #059669;">📝</div>
                          <div class="content-info">
                            <h4>${q.quiz_title}</h4>
                            <p style="color:#64748B; font-size:13px; margin-top:5px;">Quiz / Assessment • ${q.duration_mins} Mins</p>
                          </div>
                          <div class="content-meta">
                            <span>Deployed ${dateOpts}</span>
                            <strong>Active</strong>
                          </div>
                          <div style="display:flex; gap:8px; margin-left:15px;">
                             <button class="secondary-btn-sm" style="padding:6px 12px; font-size:12px; color:#64748B;" onclick="alert('Quiz Sandbox Module Isolated')">Manage</button>
                          </div>
                        </div>
                      `;
                  });
              }
          }
      } catch(e) { console.error("Error retrieving secondary action data tracking:", e); }
  }

  loadUploadedFiles();


  // Handle System Logout
  const logoutBtn = document.querySelector(".nav-item.logout");
  if(logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = localStorage.getItem("setu_user_email");
      if(email) {
        try {
          await fetch("logout.php", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email })
          });
        } catch(err) {
          console.error("Logout network error:", err);
        }
      }
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  // Load real students from database
  async function loadStudentRecords() {
    const tbody = document.getElementById("studentRecordsTableBody");
    if (!tbody) return;

    try {
      const res = await fetch("fetch_students.php");
      const data = await res.json();

      if (data.success) {
        tbody.innerHTML = "";

        if (data.students.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:30px;">No students registered yet.</td></tr>`;
          return;
        }

        // Avatar colour palette cycling through students
        const colours = ["#4F46E5","#DB2777","#059669","#D97706","#DC2626","#7C3AED","#0284C7"];

        data.students.forEach((s, i) => {
          const initials = s.fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const colour   = colours[i % colours.length];
          const classVal = s.class_name || "—";
          const rollVal  = s.roll_no    || "—";
          const school   = s.school_name ? `<span style="font-size:11px;color:#94A3B8;display:block;">${s.school_name}</span>` : "";

          tbody.innerHTML += `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="avatar" style="width:32px; height:32px; font-size:12px; background:${colour};">${initials}</div>
                  <div>
                    <strong>${s.fullname}</strong>
                    ${school}
                  </div>
                </div>
              </td>
              <td style="color:#64748B;">${classVal}</td>
              <td style="color:#64748B;">${rollVal}</td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:100%; background:#E2E8F0; border-radius:4px; height:6px; min-width:80px;">
                    <div style="background:#94A3B8; height:100%; border-radius:4px; width:0%;"></div>
                  </div>
                  <span style="font-size:12px; color:#94A3B8; font-weight:500;">—</span>
                </div>
              </td>
              <td><button class="secondary-btn-sm" style="padding:6px 14px; font-size:12px;" onclick="alert('Student: ${s.fullname}\\nEmail: ${s.email}')">View Info</button></td>
            </tr>
          `;
        });
      }
    } catch (e) {
      console.error("Failed to load student records:", e);
    }
  }

  loadStudentRecords();

});