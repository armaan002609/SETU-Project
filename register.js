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

// OTP Modal Elements
const otpModal = document.getElementById("otpModal");
const otpInputs = document.querySelectorAll(".otp-input");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const displayEmail = document.getElementById("displayEmail");

// Auto-focus OTP inputs
otpInputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && e.target.value.length === 0 && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

let pendingRegistrationData = null;

// REGISTER SUBMIT - Now triggers OTP first
document.getElementById("registerForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const fullname = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  if(password !== confirm) { alert("Passwords do not match!"); return; }

  let subject = null;
  let school_name = null;
  let class_name = null;

  if(selectedRole === "Teacher") {
      subject = document.getElementById("registerSubject").value.trim();
  } else {
      school_name = document.getElementById("registerSchool").value.trim();
      class_name = document.getElementById("registerClass").value.trim();
  }

  pendingRegistrationData = { fullname, email, password, role: selectedRole, subject, school_name, class_name };

  // Trigger OTP Send
  const submitBtn = document.getElementById("registerSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending OTP...";

  try {
    const res = await fetch("otp_handler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_otp", email })
    });
    const data = await res.json();
    if (data.success) {
      displayEmail.textContent = email;
      otpModal.classList.add("active");
      // MOCK MODE: Show OTP for testing
      if (data.otp) {
        alert("MOCK MODE: Your OTP is " + data.otp);
        console.log("MOCK OTP:", data.otp);
      }
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) { alert("Network error sending OTP."); }
  submitBtn.disabled = false;
  submitBtn.textContent = "Register";
});

// VERIFY OTP & COMPLETE REGISTRATION
verifyOtpBtn.addEventListener("click", async () => {
  const code = Array.from(otpInputs).map(i => i.value).join('');
  if (code.length < 6) { alert("Enter the 6-digit code."); return; }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = "Verifying...";

  try {
    const res = await fetch("otp_handler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_otp", email: pendingRegistrationData.email, code })
    });
    const data = await res.json();
    if (data.success) {
      // OTP Verified, now complete the DB registration
      completeRegistration();
    } else {
      alert("Invalid OTP code. Please try again.");
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = "Verify & Register";
    }
  } catch (e) { alert("Verification failed."); verifyOtpBtn.disabled = false; }
});

async function completeRegistration() {
  try {
    const res = await fetch('register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingRegistrationData)
    });
    const data = await res.json();
    if(data.success) {
        alert("Account Verified & Created Successfully!");
        window.location.href = "login.html";
    } else {
        alert("Registration Failed: " + data.error);
    }
  } catch(err) { alert("Final registration step failed."); }
}