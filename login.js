// LOGIN SUBMIT (Connected to SQL Backend)
document.getElementById("loginForm").addEventListener("submit", async(e)=>{
  e.preventDefault();
  
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Authenticating...";
  submitBtn.disabled = true;

  const statusMsg = document.getElementById("loginStatus");
  if(statusMsg) statusMsg.textContent = ""; // Reset status tracker

  try {
    const res = await fetch('login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if(res.ok && data.success) {
        if(statusMsg) {
            statusMsg.style.color = "green";
            statusMsg.textContent = "Login Successful! Loading Dashboard...";
        }
        
        // Route dynamically directly onto matching Dashboards!
        if(data.role === 'Teacher') {
            try { 
              localStorage.setItem("setu_teacher_name", data.fullname);
              localStorage.setItem("setu_user_email", email);
              if (data.subject) localStorage.setItem("setu_teacher_dept", data.subject);
              if (data.emp_id) localStorage.setItem("setu_teacher_emp_id", data.emp_id);
            } catch(e){}
            window.location.assign("teacher.html");
        } else {
            try {
              localStorage.setItem("setu_student_name", data.fullname);
              localStorage.setItem("setu_user_email", email);
              if (data.school_name) localStorage.setItem("setu_student_school", data.school_name);
              if (data.class_name) localStorage.setItem("setu_student_class", data.class_name);
              if (data.roll_no) localStorage.setItem("setu_student_roll", data.roll_no);
            } catch(e){}
            window.location.assign("student.html");
        }
    } else {
        if(statusMsg) {
            statusMsg.style.color = "red";
            statusMsg.textContent = "Login Failed: " + (data.error || "Invalid Credentials");
        } else {
            alert("Login Failed: " + (data.error || "Invalid Credentials"));
        }
    }
  } catch(err) {
    console.error(err);
    if(statusMsg) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "Network Crash: Please ensure you access this via localhost/SETU and not file://";
    } else {
        alert("Fatal Error! Could not connect to Database.");
    }
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Google Sign-In Callback
window.handleGoogleSignIn = async (response) => {
  const statusMsg = document.getElementById("loginStatus");
  if(statusMsg) statusMsg.textContent = "Authenticating with Google...";
  
  try {
    const res = await fetch('google_auth.php', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: response.credential })
    });
    const data = await res.json();
    if(data.success) {
        if(statusMsg) {
          statusMsg.style.color = "green";
          statusMsg.textContent = "Google Login Success! Redirecting...";
        }
        if (data.role === 'Teacher') {
          localStorage.setItem("setu_teacher_name", data.fullname);
          localStorage.setItem("setu_user_email", data.email || "");
          if (data.subject) localStorage.setItem("setu_teacher_dept", data.subject);
          window.location.assign("teacher.html");
        } else {
          localStorage.setItem("setu_student_name", data.fullname);
          localStorage.setItem("setu_user_email", data.email || "");
          window.location.assign("student.html");
        }
    } else { alert("Google Auth Failed: " + (data.error || "Unknown Error")); }
  } catch(err) { alert("Network error during Google Authentication."); }
};