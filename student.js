// SETU Cloned Dashboard Interactions

document.addEventListener("DOMContentLoaded", () => {
  // Removed aggressive frontend auth gate to ensure clean redirection
  const sessionActive = localStorage.getItem("setu_user_email");

  // ── Student Sidebar: Live Classes ────────────────────────────────────────
  const sLiveToggle = document.getElementById("sLiveToggle");
  const sLivePanel  = document.getElementById("sLivePanel");
  const sLiveList   = document.getElementById("sLiveList");
  const sLiveBadge  = document.getElementById("sLiveBadge");

  async function loadStudentLive() {
    if (!sLiveList) return;
    try {
      const res  = await fetch("fetch_all_live_student.php");
      const data = await res.json();
      const sessions = data.sessions || [];
      sLiveBadge.textContent = sessions.length;
      sLiveBadge.style.background = sessions.some(s => s.status === "Live") ? "#EF4444" : "#94A3B8";
      if (sessions.length === 0) {
        sLiveList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No sessions available yet.</p>`;
        return;
      }
      sLiveList.innerHTML = sessions.map(s => {
        const href   = s.session_link ? s.session_link : "#";
        const target = s.session_link ? ' target="_blank" rel="noopener"' : "";
        const dot    = s.status === "Live" ? "#EF4444" : "#94A3B8";
        const badge  = s.status === "Live"
          ? `<span style="background:#FEE2E2;color:#EF4444;border-radius:6px;padding:1px 5px;font-size:10px;font-weight:600;margin-left:4px;">LIVE</span>` : "";
        return `
          <a href="${href}"${target} class="s-session-link">
            <div class="s-session-dot" style="background:${dot};"></div>
            <div class="s-meta">
              <strong>${s.session_title}</strong>${badge}
              <span>By ${s.teacher_name || 'Teacher'}</span>
              ${s.session_link ? `<span>${s.session_link.replace(/https?:\/\//,'').substring(0,32)}…</span>` : ''}
            </div>
          </a>`;
      }).join('');
      if (sessions.some(s => s.status === "Live")) sLivePanel.style.display = "block";
    } catch(e) { console.error("Live sidebar:", e); }
  }
  if (sLiveToggle) sLiveToggle.addEventListener("click", () => {
    sLivePanel.style.display = sLivePanel.style.display !== "none" ? "none" : "block";
  });
  loadStudentLive();

  // ── Student Sidebar: Recorded Sessions ───────────────────────────────────
  const sRecordedToggle = document.getElementById("sRecordedToggle");
  const sRecordedPanel  = document.getElementById("sRecordedPanel");
  const sRecordedList   = document.getElementById("sRecordedList");
  const sRecordedBadge  = document.getElementById("sRecordedBadge");

  async function loadStudentRecorded() {
    if (!sRecordedList) return;
    try {
      const res  = await fetch("fetch_all_recorded_student.php");
      const data = await res.json();
      const videos = data.videos || [];
      sRecordedBadge.textContent = videos.length;
      sRecordedBadge.style.background = videos.length > 0 ? "#D97706" : "#94A3B8";
      if (videos.length === 0) {
        sRecordedList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No recorded sessions yet.</p>`;
        return;
      }
      sRecordedList.innerHTML = videos.map(v => {
        const mb  = (v.file_size_bytes / (1024*1024)).toFixed(1);
        const dt  = new Date(v.uploaded_at).toLocaleDateString();
        return `
          <a href="uploads/${v.stored_filename}" target="_blank" rel="noopener" class="s-session-link">
            <div class="s-session-dot" style="background:#D97706;"></div>
            <div class="s-meta">
              <strong>${v.original_filename}</strong>
              <span>By ${v.teacher_name || 'Teacher'} &bull; ${mb} MB &bull; ${dt}</span>
            </div>
          </a>`;
      }).join('');
    } catch(e) { console.error("Recorded sidebar:", e); }
  }
  if (sRecordedToggle) sRecordedToggle.addEventListener("click", () => {
    sRecordedPanel.style.display = sRecordedPanel.style.display !== "none" ? "none" : "block";
  });
  loadStudentRecorded();

  // ── Student Sidebar: Quizzes (Take Quiz, no edit/delete) ─────────────────
  const sQuizzesToggle = document.getElementById("sQuizzesToggle");
  const sQuizzesPanel  = document.getElementById("sQuizzesPanel");
  const sQuizzesList   = document.getElementById("sQuizzesList");
  const sQuizzesBadge  = document.getElementById("sQuizzesBadge");

  // Take Quiz modal
  const takeQuizModal       = document.getElementById("takeQuizModal");
  const closeTakeQuizBtn    = document.getElementById("closeTakeQuizBtn");
  const cancelTakeQuizBtn   = document.getElementById("cancelTakeQuizBtn");
  const submitQuizBtn       = document.getElementById("submitQuizBtn");
  const quizQuestionsView   = document.getElementById("quizQuestionsView");
  const quizResultView      = document.getElementById("quizResultView");
  const quizFooter          = document.getElementById("quizFooter");
  const takeQuizTitle       = document.getElementById("takeQuizTitle");
  const takeQuizMeta        = document.getElementById("takeQuizMeta");
  const quizTimerEl         = document.getElementById("quizTimer");
  const resultScore         = document.getElementById("resultScore");
  const resultText          = document.getElementById("resultText");
  const retryQuizBtn        = document.getElementById("retryQuizBtn");

  let currentQuiz = null;
  let timerInterval = null;

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function startTimer(minutes) {
    let secs = minutes * 60;
    quizTimerEl.textContent = `${minutes}:00`;
    timerInterval = setInterval(() => {
      secs--;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      quizTimerEl.textContent = `${m}:${String(s).padStart(2,'0')}`;
      quizTimerEl.style.color = secs <= 60 ? "#EF4444" : "#64748B";
      if (secs <= 0) { stopTimer(); submitQuizAnswers(); }
    }, 1000);
  }

  function openTakeQuizModal(quiz) {
    currentQuiz = quiz;
    takeQuizTitle.textContent = quiz.quiz_title;
    takeQuizMeta.textContent  = `By ${quiz.teacher_name || 'Teacher'} • ${quiz.duration_mins} min • ${quiz.questions.length} questions`;
    quizQuestionsView.style.display = "flex";
    quizResultView.style.display    = "none";
    quizFooter.style.display        = "flex";

    quizQuestionsView.innerHTML = quiz.questions.map((q, i) => {
      const opts = [
        { key: 'A', val: q.option_a },
        { key: 'B', val: q.option_b },
        { key: 'C', val: q.option_c },
        { key: 'D', val: q.option_d },
      ].filter(o => o.val);
      return `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px;">
          <p style="font-size:14px;font-weight:600;color:#0F172A;margin-bottom:10px;">Q${i+1}. ${q.question_text}</p>
          ${opts.map(o => `
            <label class="quiz-option">
              <input type="radio" name="q_${q.id}" value="${o.key}">
              <span><strong>${o.key}.</strong> ${o.val}</span>
            </label>`).join('')}
        </div>`;
    }).join('');

    takeQuizModal.classList.add("active");
    startTimer(quiz.duration_mins);
  }

  async function submitQuizAnswers() {
    stopTimer();
    if (!currentQuiz) return;
    const email = localStorage.getItem("setu_user_email");
    const name  = localStorage.getItem("setu_student_name") || "Student";

    const answers = currentQuiz.questions.map(q => {
      const sel = document.querySelector(`input[name="q_${q.id}"]:checked`);
      return { question_id: q.id, selected: sel ? sel.value : "" };
    });

    submitQuizBtn.textContent = "Grading...";
    submitQuizBtn.disabled = true;
    try {
      const res  = await fetch("submit_quiz_attempt.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ quiz_id: currentQuiz.id, student_email: email, student_name: name, answers })
      });
      const data = await res.json();
      if (data.success) {
        quizQuestionsView.style.display = "none";
        quizFooter.style.display        = "none";
        quizResultView.style.display    = "flex";
        resultScore.textContent         = `${data.score} / ${data.total}`;
        resultText.textContent          = `You scored ${data.percent}% — ${data.percent >= 70 ? "Great job! 🌟" : data.percent >= 40 ? "Keep practising! 💪" : "Don't give up! 📖"}`;
        quizTimerEl.textContent = "";

        // Show detailed review
        const reviewList = document.getElementById("quizReviewList");
        if (reviewList && data.review_data) {
          reviewList.innerHTML = data.review_data.map((q, i) => {
            const studentAns = answers.find(a => a.question_id == q.id)?.selected || "None";
            const isCorrect  = (studentAns === q.correct_option);
            
            return `
              <div style="padding:15px; border-radius:12px; border:1px solid ${isCorrect ? '#DCFCE7' : '#FEE2E2'}; background:${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                <p style="font-weight:600; font-size:14px; margin-bottom:10px;">Q${i+1}. ${q.question_text}</p>
                <div style="font-size:13px; display:flex; flex-direction:column; gap:6px;">
                  <span style="color:${isCorrect ? '#059669' : '#DC2626'}; font-weight:500;">Your Answer: ${studentAns} ${isCorrect ? '✅' : '❌'}</span>
                  ${!isCorrect ? `<span style="color:#059669; font-weight:500;">Correct Answer: ${q.correct_option}</span>` : ''}
                  <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #E2E8F0; color:#64748B;">
                    <strong style="color:#475569; font-size:12px;">Solution / Explanation:</strong>
                    <p style="margin-top:4px; line-height:1.5;">${q.explanation || "No explanation provided."}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      } else { alert("Submission failed: " + data.error); }
    } catch(e) { 
      console.error(e);
      alert("Network error submitting quiz."); 
    }
    submitQuizBtn.textContent = "📝 Submit Quiz";
    submitQuizBtn.disabled = false;
  }

  const closeTakeQuiz = () => {
    stopTimer();
    takeQuizModal.classList.remove("active");
    currentQuiz = null;
  };
  if (closeTakeQuizBtn)  closeTakeQuizBtn.addEventListener("click",  closeTakeQuiz);
  if (cancelTakeQuizBtn) cancelTakeQuizBtn.addEventListener("click", closeTakeQuiz);
  if (retryQuizBtn)      retryQuizBtn.addEventListener("click",      closeTakeQuiz);
  if (submitQuizBtn)     submitQuizBtn.addEventListener("click",     submitQuizAnswers);

  window._takeQuiz = (id) => {
    console.log("Taking quiz with ID:", id);
    const quiz = (window._sQuizzesCache || []).find(q => q.id == id);
    if (quiz) {
      openTakeQuizModal(quiz);
    } else {
      console.warn("Quiz not found in cache for ID:", id);
    }
  };

  window._requestRetake = async (id) => {
    const email = localStorage.getItem("setu_user_email");
    try {
      const res = await fetch("quiz_retake_handler.php", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ action: 'request_retake', quiz_id: id, email })
      });
      const data = await res.json();
      if (data.success) {
        alert("Retake request sent to teacher!");
        loadStudentQuizzes(); 
      } else { alert("Failed: " + data.error); }
    } catch(e) { alert("Network error."); }
  };

  async function loadStudentQuizzes() {
    if (!sQuizzesList) return;
    const email = localStorage.getItem("setu_user_email");
    try {
      const res  = await fetch(`fetch_all_quizzes_student.php?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const quizzes = data.quizzes || [];
      sQuizzesBadge.textContent = quizzes.length;
      sQuizzesBadge.style.background = quizzes.length > 0 ? "#059669" : "#94A3B8";
      if (quizzes.length === 0) {
        sQuizzesList.innerHTML = `<p style="color:#94A3B8;font-size:12px;padding:6px 0;">No quizzes yet.</p>`;
        return;
      }
      sQuizzesList.innerHTML = quizzes.map(quiz => {
        let btnHtml = "";
        const sub = `By ${quiz.teacher_name||'Teacher'} • ${quiz.duration_mins} min • ${quiz.questions.length} Q`;
        
        if (quiz.already_taken == 0 || quiz.retake_allowed == 1) {
          // Not taken or re-take approved
          btnHtml = `<button onclick="window._takeQuiz(${quiz.id})" 
                      style="background:#DCFCE7;color:#059669;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;">▶ Take Quiz</button>`;
        } else if (quiz.retake_requested == 1) {
          // Pending request
          btnHtml = `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
                       <span style="font-size:10px;color:#D97706;font-weight:600;">⏳ Requested</span>
                       <button onclick="window._viewResults(${quiz.id})" 
                        style="background:#F1F5F9;color:#64748B;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;">📊 Results</button>
                     </div>`;
        } else {
          // Taken, no request yet
          btnHtml = `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
                       <button onclick="window._takeQuiz(${quiz.id})" style="display:none;"></button> <!-- Hidden but kept for logic -->
                       <button onclick="window._viewResults(${quiz.id})" 
                        style="background:#DBEAFE;color:#2563EB;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;">📊 Results</button>
                       <button onclick="window._requestRetake(${quiz.id})" 
                        style="background:#FFF7ED;color:#C2410C;border:none;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;cursor:pointer;">🔄 Retake?</button>
                     </div>`;
        }

        return `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="flex:1;">
              <strong style="font-size:13px;color:#0F172A;">${quiz.quiz_title}</strong>
              <span style="font-size:10px;color:#94A3B8;display:block;">${sub}</span>
            </div>
            ${btnHtml}
          </div>
        </div>`;
      }).join('');
      window._sQuizzesCache = quizzes;
    } catch(e) { console.error("Quizzes sidebar:", e); }
  }

  // Helper for viewing results without re-taking
  window._viewResults = async (id) => {
    const quiz = (window._sQuizzesCache || []).find(q => q.id == id);
    if (!quiz) return;
    
    const email = localStorage.getItem("setu_user_email");
    
    // Show a loading state in the modal
    takeQuizTitle.textContent = quiz.quiz_title;
    takeQuizMeta.textContent  = "Loading previous results...";
    quizQuestionsView.innerHTML = "Fetching results...";
    takeQuizModal.classList.add("active");
    quizFooter.style.display = "none";

    try {
      // Fetch score and review data from the database
      const res = await fetch(`fetch_quiz_result.php?quiz_id=${id}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        quizQuestionsView.style.display = "none";
        quizResultView.style.display    = "flex";
        resultScore.textContent         = `${data.score} / ${data.total}`;
        resultText.textContent          = `Previous Score: ${data.percent}%`;
        quizTimerEl.textContent         = "";
        
        const reviewList = document.getElementById("quizReviewList");
        if (reviewList && data.review_data) {
          reviewList.innerHTML = data.review_data.map((q, i) => {
            const isCorrect = q.student_answer === q.correct_option;
            const statusColor = isCorrect ? "#059669" : "#DC2626";
            const statusBg = isCorrect ? "#DCFCE7" : "#FEE2E2";
            
            return `
              <div style="padding:15px; border-radius:12px; border:1px solid #E2E8F0; background:#F8FAFC;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <p style="font-weight:600; font-size:14px; margin:0;">Q${i+1}. ${q.question_text}</p>
                  <span style="background:${statusBg}; color:${statusColor}; border-radius:6px; padding:2px 8px; font-size:11px; font-weight:600;">
                    ${isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <div style="font-size:13px; display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; gap:8px;">
                     <span style="color:#64748B;">Your Answer:</span>
                     <span style="font-weight:600; color:${statusColor};">${q.student_answer || "Not Answered"}</span>
                  </div>
                  <div style="display:flex; gap:8px;">
                     <span style="color:#64748B;">Correct Answer:</span>
                     <span style="font-weight:600; color:#059669;">${q.correct_option}</span>
                  </div>
                  <div style="margin-top:8px; padding:10px; border-radius:8px; background:#F1F5F9; color:#475569;">
                    <strong style="color:#1E293B; font-size:12px; display:block; margin-bottom:4px;">💡 Solution:</strong>
                    <p style="margin:0; line-height:1.4;">${q.explanation || "No explanation provided."}</p>
                  </div>
                </div>
              </div>`;
          }).join('');
        }
      } else { alert("Failed to fetch results: " + data.error); }
    } catch(e) { alert("Failed to load results."); }
  };
  if (sQuizzesToggle) sQuizzesToggle.addEventListener("click", () => {
    sQuizzesPanel.style.display = sQuizzesPanel.style.display !== "none" ? "none" : "block";
  });
  loadStudentQuizzes();
  // ─────────────────────────────────────────────────────────────────────────

  const filterBtns = document.querySelectorAll('.filter-btn');

  // Simple active state toggler for the filter bar
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const playBtns = document.querySelectorAll('.play-btn');
  playBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert("Loading lesson video stream...");
    });
  });

  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert("Opening recommended module...");
    });
  });

  // Profile Edit Modal Logic
  const welcomeName = document.getElementById("welcomeName");
  const profileName = document.getElementById("profileName");
  const profileClass = document.getElementById("profileClass");
  const profileSchool = document.getElementById("profileSchool");
  const profileRoll = document.getElementById("profileRoll");
  
  const editProfileBtn = document.getElementById("editProfileBtn");
  const profileModal = document.getElementById("profileModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  
  const editNameInput = document.getElementById("editNameInput");
  const editClassInput = document.getElementById("editClassInput");
  const editSchoolInput = document.getElementById("editSchoolInput");
  const editRollInput = document.getElementById("editRollInput");

  // Load saved data
  const savedName = localStorage.getItem("setu_student_name");
  const savedClass = localStorage.getItem("setu_student_class");
  const savedSchool = localStorage.getItem("setu_student_school");
  const savedRoll = localStorage.getItem("setu_student_roll");
  
  if(savedName) {
    if(welcomeName) welcomeName.textContent = savedName;
    if(profileName) profileName.textContent = savedName;
  }
  if(savedClass && profileClass) {
    profileClass.textContent = savedClass;
  }
  if(savedSchool && profileSchool) {
    profileSchool.textContent = savedSchool;
  }
  if(savedRoll && profileRoll) {
    profileRoll.textContent = savedRoll;
  }

  // Open Modal
  const openModal = () => {
    editNameInput.value = profileName.textContent;
    editClassInput.value = profileClass.textContent;
    editSchoolInput.value = profileSchool.textContent;
    editRollInput.value = profileRoll.textContent.replace("Roll No: ", "");
    profileModal.classList.add("active");
  };

  // Close Modal
  const closeModal = () => {
    profileModal.classList.remove("active");
  };

  if(editProfileBtn) editProfileBtn.addEventListener("click", openModal);
  if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if(cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  
  // Save Profile Database Hook
  if(saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const newName = editNameInput.value.trim();
      const newClass = editClassInput.value.trim();
      const newSchool = editSchoolInput.value.trim();
      const newRoll = editRollInput.value.trim();
      const email = localStorage.getItem("setu_user_email");

      if(!email) {
          alert("Session active footprint missing. Please re-login!");
          return;
      }

      const saveBtnOriginalText = saveProfileBtn.textContent;
      saveProfileBtn.textContent = "Saving...";
      saveProfileBtn.disabled = true;

      const finalName = newName || savedName;
      const finalClass = newClass || savedClass;
      const finalSchool = newSchool || savedSchool;
      
      let finalRoll = newRoll;
      if (!finalRoll && savedRoll) {
          finalRoll = savedRoll.replace("Roll No: ", "").trim();
      }

      try {
          const res = await fetch("update_profile.php", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ 
                  email: email, 
                  fullname: finalName, 
                  class_name: finalClass, 
                  school_name: finalSchool, 
                  roll_no: finalRoll 
              })
          });
          const data = await res.json();
          
          if(data.success) {
              if(newName) {
                if(welcomeName) welcomeName.textContent = newName;
                if(profileName) profileName.textContent = newName;
                localStorage.setItem("setu_student_name", newName);
              }
              if(newClass) {
                if(profileClass) profileClass.textContent = newClass;
                localStorage.setItem("setu_student_class", newClass);
              }
              if(newSchool) {
                if(profileSchool) profileSchool.textContent = newSchool;
                localStorage.setItem("setu_student_school", newSchool);
              }
              if(newRoll) {
                if(profileRoll) profileRoll.textContent = `Roll No: ${newRoll}`;
                localStorage.setItem("setu_student_roll", `Roll No: ${newRoll}`);
              }
              
              closeModal();
              alert("Profile Updated in Database!");
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
});
