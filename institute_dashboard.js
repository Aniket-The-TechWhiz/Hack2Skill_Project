// instdashboard.js - Institute Dashboard JS (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYpFfChG8F8JUIPtuFhdVMjLXOx_bZViw",
  authDomain: "send-data-fbe55.firebaseapp.com",
  databaseURL: "https://send-data-fbe55-default-rtdb.firebaseio.com",
  projectId: "send-data-fbe55",
  storageBucket: "send-data-fbe55.firebasestorage.app",
  messagingSenderId: "873020849812",
  appId: "1:873020849812:web:20479326cda100d088be81",
  measurementId: "G-M33GE9NQXB"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Show content sections based on menu click.
window.showContent = function(contentId) {
  document.querySelectorAll('.content').forEach(section => {
    section.classList.add('hidden');
  });
  const selected = document.getElementById(contentId);
  if (selected) {
    selected.classList.remove('hidden');
    if (contentId === 'faculty') window.loadFacultyCards();
    if (contentId === 'student') window.loadStudentCards();
    if (contentId === 'branch') window.loadBranchCards();
    if (contentId === 'notification') window.loadNotificationData();
    if (contentId === 'profile') window.loadProfileData();
  }
};

// Sign-out function.
window.signOut = function() {
  // Clear the user session data.
  localStorage.removeItem('user');
  // Redirect to the login page.
  window.location.href = 'first_page.html';
};


// Faculty Section: Load faculty cards from DB.
window.loadFacultyCards = function() {
  const container = document.querySelector('.faculty-cards');
  if (container) {
    container.innerHTML = "";
    const facultyRef = ref(database, "faculty");
    onValue(facultyRef, (snapshot) => {
      container.innerHTML = "";
      snapshot.forEach((childSnapshot) => {
        const faculty = childSnapshot.val();
        const card = document.createElement('div');
        card.className = "faculty-card";
        card.innerHTML = `
          <div class="profile-photo">
            <img src="${faculty.photo || 'https://via.placeholder.com/300'}" alt="${faculty.fullName}">
          </div>
          <div class="faculty-details">
            <h3>${faculty.fullName}</h3>
            <p><strong>Subject:</strong> ${faculty.subject}</p>
            <p><strong>Branch:</strong> ${faculty.branch || "N/A"}</p>
            <p><strong>With Institute Since:</strong> ${faculty.since || "N/A"}</p>
          </div>
        `;
        container.appendChild(card);
      });
    });
  }
};

// Student Section: Load student cards.
window.studentData = [];
window.fetchStudentData = function(callback) {
  const studentRef = ref(database, "students");
  onValue(studentRef, (snapshot) => {
    const students = [];
    snapshot.forEach((childSnapshot) => {
      const prnKey = childSnapshot.key;
      const data = childSnapshot.val();
      const studentObj = {
        prn: prnKey,
        fullName: data.fullName,
        branch: data.branch || "N/A",
        year: data.year || "N/A",
        photo: data.photo || "https://via.placeholder.com/150"
      };
      students.push(studentObj);
    });
    callback(students);
  });
};

window.renderStudentCards = function(students, filterBranch = "") {
  const container = document.querySelector('.student-cards');
  const countDisplay = document.getElementById('studentCount');
  let filteredData = filterBranch ? students.filter(s => s.branch === filterBranch) : students;
  countDisplay.textContent = `Total Students: ${filteredData.length}`;
  container.innerHTML = "";
  if(filteredData.length === 0) {
    container.innerHTML = `<p>No students found for branch "${filterBranch}"</p>`;
  } else {
    filteredData.forEach((student) => {
      const card = document.createElement('div');
      card.className = "student-card";
      card.innerHTML = `
        <div class="student-photo">
          <img src="${student.photo}" alt="${student.fullName}">
        </div>
        <div class="student-details">
          <h3>${student.fullName}</h3>
          <p><strong>PRN:</strong> ${student.prn}</p>
          <p><strong>Branch:</strong> ${student.branch}</p>
          <p><strong>Year:</strong> ${student.year}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }
};

window.loadStudentCards = function(filterBranch = "") {
  window.fetchStudentData(function(students) {
    window.studentData = students;
    window.renderStudentCards(students, filterBranch);
  });
};

window.filterStudents = function() {
  const filterValue = document.getElementById('studentBranchFilter').value;
  window.renderStudentCards(window.studentData, filterValue);
};

// Branch Section: For demo, static branch cards.
window.loadBranchCards = function() {
  const container = document.querySelector('.branch-cards');
  if (container) {
    const branches = [
      { name: "Computer Science Engineering (CSE)", icon: "fas fa-laptop-code" },
      { name: "Information Technology (IT)", icon: "fas fa-network-wired" },
      { name: "Data Science/Big Data Engineering", icon: "fas fa-chart-line" },
      { name: "Robotics Engineering", icon: "fas fa-robot" }
    ];
    container.innerHTML = "";
    branches.forEach(branch => {
      const card = document.createElement('div');
      card.className = "branch-card";
      card.innerHTML = `
        <i class="${branch.icon} branch-icon"></i>
        <div class="branch-name">${branch.name}</div>
      `;
      container.appendChild(card);
    });
  }
};

// Notification Section.
window.loadNotificationData = function() {
  const list = document.getElementById('request-list');
  if (list) {
    list.innerHTML = "<li>No pending requests.</li>";
  }
};

// Profile Section.
window.loadProfileData = function() {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (userData && userData.role === 'faculty') {
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
      profileCard.innerHTML = `
        <div class="profile-photo">
          <img src="${userData.photo || 'https://via.placeholder.com/150'}" alt="${userData.fullName}">
        </div>
        <div class="profile-details">
          <h3>${userData.fullName}</h3>
          <p><strong>ID:</strong> ${userData.id}</p>
          <p><strong>Role:</strong> ${userData.role}</p>
          <p><strong>Department:</strong> ${userData.department || "N/A"}</p>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Attach event listeners for menu items.
  document.querySelectorAll('.menu-items li').forEach(item => {
    item.addEventListener('click', function () {
      const contentId = this.getAttribute('data-content-id');
      window.showContent(contentId);
    });
  });
  // Load default section.
  window.showContent('faculty');
  window.loadFacultyCards();
  
  // Challenge form submission, download, etc., can be implemented here.
});
