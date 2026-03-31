// ROLE SELECT TOGGLE
let selectedRole = "Student"; // Default role

document.querySelectorAll(".role-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".role-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    
    // Check which role was clicked based on innerText
    const subjectWrapper = document.getElementById("subjectWrapper");
    const studentWrapper = document.getElementById("studentWrapper");

    if(btn.textContent.includes("Teacher") || btn.textContent.includes("Faculty")) {
      selectedRole = "Teacher";
      if(subjectWrapper) subjectWrapper.style.display = "block";
      if(studentWrapper) studentWrapper.style.display = "none";
    } else {
      selectedRole = "Student";
      if(subjectWrapper) subjectWrapper.style.display = "none";
      if(studentWrapper) studentWrapper.style.display = "block";
    }
  });
});

// REGISTER SUBMIT (Connected to SQL Backend)
document.getElementById("registerForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const fullname = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  let subject = null;
  let school_name = null;
  let class_name = null;

  if(selectedRole === "Teacher") {
      const subjInput = document.getElementById("registerSubject");
      if(subjInput) subject = subjInput.value.trim();
      if(!subject) {
          alert("Please specify the subject you teach!");
          return;
      }
  } else {
      const schInput = document.getElementById("registerSchool");
      const clsInput = document.getElementById("registerClass");
      if(schInput) school_name = schInput.value.trim();
      if(clsInput) class_name = clsInput.value.trim();
  }

  if(password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  // Disable button to prevent multi-submit
  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Registering...";
  submitBtn.disabled = true;

  try {
    const res = await fetch('register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: fullname, email, password, role: selectedRole, subject, school_name, class_name })
    });

    const data = await res.json();
    
    if(res.ok) {
        alert("Account Created Successfully! Your data is saved securely in the Database.");
        window.location.href = "login.html";
    } else {
        alert("Registration Failed: " + data.error);
    }
  } catch(err) {
    console.error(err);
    alert("Could not connect to the Backend Server. Make sure node server.js is running!");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});