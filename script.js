// NAVIGATION
const navLinks=document.querySelectorAll(".nav-link");
const buttons=document.querySelectorAll("[data-target]");

function scrollToSection(id){
const section=document.getElementById(id);
if(!section) return;

section.scrollIntoView({behavior:"smooth"});

navLinks.forEach(l=>l.classList.remove("active"));
const active=document.querySelector(`.nav-link[data-target="${id}"]`);
if(active) active.classList.add("active");
}

navLinks.forEach(link=>{
link.addEventListener("click",()=>scrollToSection(link.dataset.target));
});

buttons.forEach(btn=>{
btn.addEventListener("click",()=>scrollToSection(btn.dataset.target));
});

// COURSE ENROLL
let enrolled=[];

function enrollCourse(course){
if(!enrolled.includes(course)){
enrolled.push(course);
renderCourses();
alert("Enrolled in "+course);
}
}

function renderCourses(){
const box=document.getElementById("myCourses");
box.innerHTML="<h3>Enrolled Courses</h3>";

enrolled.forEach(c=>{
box.innerHTML+=`<p>📘 ${c}</p>`;
});
}

// QUIZ
function checkAnswer(btn,correct){
const result=document.getElementById("quizResult");

if(correct){
result.innerHTML="✅ Correct Answer!";
result.style.color="#22c55e";
}else{
result.innerHTML="❌ Wrong Answer";
result.style.color="red";
}
}

// document.querySelector(".login-btn")?.addEventListener("click",()=>{
// alert("Login Page Coming Soon");
// });

// document.querySelector(".register-btn")?.addEventListener("click",()=>{
// alert("Register Page Coming Soon");
// });

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

// SPLASH SCREEN AUTO HIDE
window.addEventListener("load", () => {

  setTimeout(() => {
    document.getElementById("splashScreen").classList.add("splash-hide");
  }, 2000); // 2 seconds

});

// AUTH STATE UI UPDATE
document.addEventListener("DOMContentLoaded", () => {
  const userEmail = localStorage.getItem("setu_user_email");
  const isStudent = localStorage.getItem("setu_student_name");
  const isTeacher = localStorage.getItem("setu_teacher_name");

  if (userEmail) {
    // Replace Login/Register buttons with a dynamic Dashboard button!
    const authButtons = document.querySelector(".auth-buttons");
    if (authButtons) {
      if(isTeacher) {
        authButtons.innerHTML = `<button class="teacher-btn" style="background:#FEF3C7; color:#B45309; border:none; padding:8px 14px; border-radius:8px; font-weight:500; cursor:pointer; width:100%;" onclick="window.location.href='teacher.html'">👨‍🏫 Teacher Dashboard</button>`;
      } else {
        authButtons.innerHTML = `<button class="student-btn" style="background:#E0F2FE; color:#2563EB; border:none; padding:8px 14px; border-radius:8px; font-weight:500; cursor:pointer; width:100%;" onclick="window.location.href='student.html'">🎓 Student Dashboard</button>`;
      }
    }
    
    // Target Hero CTA Button too!
    const heroDashboardBtn = document.querySelector('.cta button[data-target="dashboard"]');
    if (heroDashboardBtn) {
      heroDashboardBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = isTeacher ? 'teacher.html' : 'student.html';
      };
    }
  }
});

// AUTH GATER INTERCEPTOR
function checkAuthAndNavigate(role) {
  const email = localStorage.getItem("setu_user_email");
  if (!email) {
    alert("Access Denied: Please log in or register first to access your secure dashboard.");
    window.location.href = "login.html";
  } else {
    if (role === 'Student') window.location.href = "student.html";
    if (role === 'Teacher') window.location.href = "teacher.html";
  }
}