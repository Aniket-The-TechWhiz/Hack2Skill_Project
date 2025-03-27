// code.js - Updated Student Dashboard JS (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

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

/* ---------- User & Global Variables ---------- */
const currentUser = JSON.parse(localStorage.getItem("user")) || {};
const currentStudentId = currentUser.id || "PRN004";

// Reset counters if a different user logs in.
if (localStorage.getItem("storedUserId") !== currentStudentId) {
  localStorage.setItem("todaySolvedCount", "0");
  localStorage.setItem("totalChallengesSolved", "0");
  localStorage.setItem("totalLinesWritten", "0");
  localStorage.setItem("totalHoursOptimized", "0");
  localStorage.removeItem("weeklyActivity");
  localStorage.setItem("storedUserId", currentStudentId);
}

let challengesData = [];
let currentChallenge = null;
let currentLanguage = "";
// Flag to track if the code output has been validated successfully.
let challengePassed = false;

/* ---------- Helper Functions ---------- */
function getDayName(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function checkWeekReset() {
  let weekStart = localStorage.getItem("weekStart");
  const now = new Date();
  const diffToMonday = (now.getDay() + 6) % 7;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - diffToMonday);
  const mondayStr = currentMonday.toISOString().split("T")[0];
  if (weekStart !== mondayStr) {
    const weeklyActivity = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    localStorage.setItem("weeklyActivity", JSON.stringify(weeklyActivity));
    localStorage.setItem("weekStart", mondayStr);
  }
}

/* ---------- UI Update Functions ---------- */
// This function now builds a graph line for each language loaded.
async function updateProgressGraph() {
  const progressGraphContainer = document.querySelector(".progress-graph");
  progressGraphContainer.innerHTML = "";

  // Retrieve all language cards that were loaded.
  const languageCards = document.querySelectorAll(".card");
  // Retrieve the student's solved counts from the database.
  const studentSnap = await get(ref(database, "students/" + currentStudentId));
  let solvedPerLanguage = {};
  if (studentSnap.exists()) {
    solvedPerLanguage = studentSnap.val().solvedPerLanguage || {};
  }

  // Iterate over each language card.
  for (const card of languageCards) {
    const language = card.getAttribute("data-language");
    // Get total challenges for the language.
    const langRef = ref(database, `challenges/${language}`);
    const langSnap = await get(langRef);
    let totalChallenges = 0;
    if (langSnap.exists()) {
      const challengesObj = langSnap.val();
      totalChallenges = Object.keys(challengesObj).length;
    }
    const solved = solvedPerLanguage[language] || 0;
    const progress = totalChallenges > 0 ? (solved / totalChallenges) * 100 : 0;

    const graphLine = document.createElement("div");
    graphLine.className = "graph-line";
    graphLine.style.height = progress + "%";
    const label = document.createElement("span");
    label.textContent = `${language} (${solved}/${totalChallenges})`;
    graphLine.appendChild(label);
    progressGraphContainer.appendChild(graphLine);
  }
}

function updateDailyGoalsCard() {
  const todaySolved = parseInt(localStorage.getItem("todaySolvedCount")) || 0;
  const todayHours = todaySolved * 0.5;
  const meter = document.querySelector(".meter-progress");
  meter.style.width = ((todaySolved / 4) * 100) + "%";
  meter.querySelector(".meter-text").textContent = `${todaySolved}/4 solved`;
  document.getElementById("daily-challenges").textContent = `${todaySolved}/4 Challenges`;
  document.getElementById("daily-hours").textContent = `${todayHours}h optimized`;
}

function updateWeeklyActivityCard() {
  checkWeekReset();
  const today = new Date();
  const todayDay = getDayName(today);
  const heatmapGrid = document.querySelector(".heatmap-grid");
  heatmapGrid.innerHTML = "";
  if (todayDay === "Sun") {
    heatmapGrid.textContent = "No activity tracking on Sunday.";
  } else {
    let weeklyActivity = JSON.parse(localStorage.getItem("weeklyActivity")) || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const count = weeklyActivity[todayDay] || 0;
    let color = "red";
    if (count === 4) {
      color = "green";
    } else if (count >= 2) {
      color = "blue";
    }
    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.backgroundColor = color;
    cell.title = `${todayDay}: ${count} challenges solved`;
    cell.textContent = todayDay;
    heatmapGrid.appendChild(cell);
  }
}

function updateWeeklyStatsCard() {
  document.getElementById("stat-lines").textContent = localStorage.getItem("totalLinesWritten") || 0;
  document.getElementById("stat-challenges").textContent = localStorage.getItem("totalChallengesSolved") || 0;
  document.getElementById("stat-hours").textContent = localStorage.getItem("totalHoursOptimized") || 0;
}

/* New: Update Solved Challenges UI */
function updateSolvedChallengesUI(solvedIds) {
  const challengesContainer = document.getElementById("challenges-container");
  if (!challengesContainer) return;
  const cards = challengesContainer.querySelectorAll(".challenge-card");
  cards.forEach(card => {
    const challengeId = card.getAttribute("data-challenge-id");
    if (solvedIds.includes(challengeId)) {
      card.classList.add("solved");
      const btn = card.querySelector(".btn-start");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Solved";
        btn.onclick = null;
      }
    }
  });
}

/* ---------- Leaderboard Functions ---------- */
async function loadLeaderboard() {
  const leaderboardContainer = document.querySelector(".leaderboard-entries");
  leaderboardContainer.innerHTML = "Loading leaderboard...";
  
  try {
    const studentsSnap = await get(ref(database, "students"));
    if (!studentsSnap.exists()) {
      leaderboardContainer.textContent = "No student data available.";
      return;
    }
    const students = [];
    studentsSnap.forEach(childSnap => {
      const student = childSnap.val();
      student.id = childSnap.key;
      student.solvedChallenges = student.solvedChallenges || 0;
      student.timeSpent = student.timeSpent || 0;
      students.push(student);
    });
    students.sort((a, b) => {
      if (b.solvedChallenges !== a.solvedChallenges) {
        return b.solvedChallenges - a.solvedChallenges;
      } else {
        return a.timeSpent - b.timeSpent;
      }
    });
    const topStudents = students.slice(0, 4);
    let html = "";
    topStudents.forEach((student, index) => {
      html += `
        <div class="leaderboard-item">
          <span class="rank-number">${index + 1}</span>
          <span>${student.fullName}</span>
          <span>${student.solvedChallenges}</span>
          <span>${student.timeSpent.toFixed(1)}h</span>
          <span>Progress</span>
        </div>
      `;
    });
    leaderboardContainer.innerHTML = html;
  } catch (error) {
    leaderboardContainer.textContent = "Error loading leaderboard: " + error.message;
  }
}

/* ---------- Navigation & UI Functions ---------- */
window.toggleSidebar = function() {
  const sidebar = document.getElementById("sideNav");
  const mainContent = document.getElementById("mainContent");
  sidebar.classList.toggle("collapsed");
  mainContent.classList.toggle("expanded");
};

window.updateActiveElements = function(sectionId, event) {
  document.querySelectorAll(".content-section").forEach(section => {
    section.classList.remove("active");
    section.style.display = "none";
  });
  document.getElementById(sectionId).classList.add("active");
  document.getElementById(sectionId).style.display = "block";
  document.querySelectorAll(".nav-links li").forEach(link => {
    link.classList.remove("active");
  });
  if (event) {
    event.currentTarget.classList.add("active");
  }
};

window.showSection = function(event, sectionId) {
  window.updateActiveElements(sectionId, event);
  if (window.innerWidth <= 768) {
    window.toggleSidebar();
  }
};

window.loadUserProfile = function() {
  const userData = localStorage.getItem("user");
  if (userData) {
    const user = JSON.parse(userData);
    const usernameElements = document.getElementsByClassName("username");
    Array.from(usernameElements).forEach(elem => {
      elem.textContent = user.fullName;
      elem.value = user.fullName;
    });
  }
};

/* ---------- Language & Challenges Loading ---------- */
window.loadLanguageCards = function() {
  const languageCardsContainer = document.getElementById("language-cards");
  if (!languageCardsContainer) return;
  
  const challengesRef = ref(database, "challenges");
  onValue(challengesRef, (snapshot) => {
    languageCardsContainer.innerHTML = "";
    snapshot.forEach((languageSnapshot) => {
      const language = languageSnapshot.key;
      if (languageSnapshot.exists()) {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-language", language);
        card.innerHTML = `
          <h2>${language}</h2>
          <p>Click to see ${language} challenges</p>
        `;
        card.addEventListener("click", function() {
          window.showChallenges(language);
        });
        languageCardsContainer.appendChild(card);
      }
    });
    // After loading language cards, update progress graph.
    updateProgressGraph();
  });
};

window.showChallenges = function(language) {
  currentLanguage = language;
  document.getElementById("programming-languages").style.display = "none";
  document.getElementById("challenges-view").style.display = "block";
  document.getElementById("challenge-title").textContent = `${language} Challenges`;
  const challengesContainer = document.getElementById("challenges-container");
  challengesContainer.innerHTML = "Loading challenges...";
  
  const langRef = ref(database, `challenges/${language}`);
  onValue(langRef, (snapshot) => {
    challengesContainer.innerHTML = "";
    challengesData = [];
    let count = 0;
    snapshot.forEach((childSnapshot) => {
      const challenge = childSnapshot.val();
      challenge.id = childSnapshot.key;
      challengesData.push(challenge);
      count++;
      const card = document.createElement("div");
      card.className = "challenge-card";
      card.setAttribute("data-challenge-id", childSnapshot.key);
      card.innerHTML = `
        <div class="challenge-info">
          <h3>${challenge.title}</h3>
          <p>Difficulty: ${challenge.difficulty}</p>
          <p>${challenge.description.substring(0, 100)}...</p>
        </div>
        <button class="btn-start" onclick="startChallenge('${childSnapshot.key}', '${language}')">
          Start Challenge
        </button>
      `;
      challengesContainer.appendChild(card);
    });
    if (count === 0) {
      challengesContainer.innerHTML = `<p>No challenges available for ${language} today.</p>`;
    } else {
      loadSolvedChallenges().then(solvedIds => {
        updateSolvedChallengesUI(solvedIds);
      });
    }
    // Update the progress graph after challenges are loaded.
    updateProgressGraph();
  });
};

window.startChallenge = function(challengeId, language) {
  const challengeRef = ref(database, `challenges/${language}/${challengeId}`);
  onValue(challengeRef, (snapshot) => {
    const challenge = snapshot.val();
    if (!challenge) return;
    currentChallenge = { id: challengeId, ...challenge };
    document.getElementById("question-title").textContent = challenge.title;
    document.getElementById("code-description").textContent = challenge.description;
    document.getElementById("code-input").textContent = `Input: ${challenge.input}`;
    document.getElementById("code-output").textContent = `Output: ${challenge.output}`;
    challengePassed = false;
    document.getElementById("coding-section").style.display = "block";
    document.getElementById("challenges-view").style.display = "none";
  });
};

window.goBackToChallenges = function() {
  document.getElementById("coding-section").style.display = "none";
  document.getElementById("challenges-view").style.display = "block";
};

window.goBackToLanguages = function() {
  document.getElementById("challenges-view").style.display = "none";
  document.getElementById("programming-languages").style.display = "block";
};

/* ---------- Code Checking & Submission Functions ---------- */
window.checkCode = async function() {
  const code = document.getElementById("code-area").value;
  const outputElem = document.getElementById("code-result");
  if (code.trim() === "") {
    outputElem.textContent = "Please write some code before checking.";
    return;
  }
  const languageMapping = {
    "Python": "python3",
    "JavaScript": "javascript",
    "Java": "java",
    "C++": "cpp",
    "HTML": "html"
  };
  let pistonLang = languageMapping[currentLanguage] || "python3";
  let fileName;
  if (pistonLang === "python3") {
    fileName = "main.py";
  } else if (pistonLang === "javascript") {
    fileName = "main.js";
  } else if (pistonLang === "java") {
    fileName = "Main.java";
  } else if (pistonLang === "cpp") {
    fileName = "main.cpp";
  } else {
    fileName = "main.txt";
  }
  const payload = {
    language: pistonLang,
    version: "*",
    files: [
      { name: fileName, content: code }
    ]
  };
  const API_URL = "https://emkc.org/api/v2/piston/execute";
  outputElem.textContent = "Running code...";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    let apiOutput = (data.run && data.run.output ? data.run.output : "").trim();
    outputElem.textContent = apiOutput;
    let expectedRaw = document.getElementById("code-output").textContent;
    let expectedOutput = expectedRaw.replace(/^Output:\s*/i, "").trim();
    if (apiOutput === expectedOutput) {
      alert("Success! Your code output matches the expected output.");
      challengePassed = true;
    } else {
      alert("Output does not match expected output.\nExpected: " + expectedOutput + "\nGot: " + apiOutput);
      challengePassed = false;
    }
  } catch (error) {
    console.error("Error running code:", error);
    outputElem.textContent = "An error occurred while running the code.";
    challengePassed = false;
  }
};

window.submitCode = async function() {
  if (!challengePassed) {
    alert("Cannot submit code. Please ensure your code output matches the expected output by clicking 'Check Code'.");
    return;
  }
  const code = document.getElementById("code-area").value;
  const outputElem = document.getElementById("code-result");
  if (code.trim() === "") {
    outputElem.textContent = "Please write some code before submitting.";
    return;
  }
  let todaySolved = parseInt(localStorage.getItem("todaySolvedCount")) || 0;
  todaySolved++;
  localStorage.setItem("todaySolvedCount", todaySolved);
  if (currentLanguage) {
    let langSolved = parseInt(localStorage.getItem("todaySolved_" + currentLanguage)) || 0;
    langSolved++;
    localStorage.setItem("todaySolved_" + currentLanguage, langSolved);
  }
  let totalSolved = parseInt(localStorage.getItem("totalChallengesSolved")) || 0;
  totalSolved++;
  localStorage.setItem("totalChallengesSolved", totalSolved);
  const linesWritten = code.split("\n").filter(line => line.trim() !== "").length;
  let totalLines = parseInt(localStorage.getItem("totalLinesWritten")) || 0;
  totalLines += linesWritten;
  localStorage.setItem("totalLinesWritten", totalLines);
  let totalHours = parseFloat(localStorage.getItem("totalHoursOptimized")) || 0;
  totalHours += 0.5;
  localStorage.setItem("totalHoursOptimized", totalHours);
  localStorage.setItem("todayHours", (todaySolved * 0.5).toString());
  checkWeekReset();
  let weeklyActivity = JSON.parse(localStorage.getItem("weeklyActivity")) || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const todayDay = getDayName(new Date());
  if (todayDay !== "Sun") {
    weeklyActivity[todayDay] = (weeklyActivity[todayDay] || 0) + 1;
    localStorage.setItem("weeklyActivity", JSON.stringify(weeklyActivity));
  }
  const studentRef = ref(database, "students/" + currentStudentId);
  const studentSnap = await get(studentRef);
  let studentData = studentSnap.exists() ? studentSnap.val() : {};
  const newSolved = (studentData.solvedChallenges || 0) + 1;
  const newTime = (studentData.timeSpent || 0) + 0.5;
  let solvedPerLanguage = studentData.solvedPerLanguage || {};
  solvedPerLanguage[currentLanguage] = (solvedPerLanguage[currentLanguage] || 0) + 1;
  let solvedChallengeIds = studentData.solvedChallengeIds || [];
  if (!solvedChallengeIds.includes(currentChallenge.id)) {
    solvedChallengeIds.push(currentChallenge.id);
  }
  update(studentRef, {
    solvedChallenges: newSolved,
    timeSpent: newTime,
    solvedPerLanguage: solvedPerLanguage,
    total_line_written: totalLines,
    solvedChallengeIds: solvedChallengeIds
  });
  alert("Challenge submitted successfully!");
  window.goBackToChallenges();
  updateSolvedChallengesUI(solvedChallengeIds);
};

async function loadSolvedChallenges() {
  const studentRef = ref(database, "students/" + currentStudentId);
  const studentSnap = await get(studentRef);
  if (studentSnap.exists()) {
    const studentData = studentSnap.val();
    return studentData.solvedChallengeIds || [];
  }
  return [];
}

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("todaySolvedCount")) localStorage.setItem("todaySolvedCount", "0");
  if (!localStorage.getItem("totalChallengesSolved")) localStorage.setItem("totalChallengesSolved", "0");
  if (!localStorage.getItem("totalLinesWritten")) localStorage.setItem("totalLinesWritten", "0");
  if (!localStorage.getItem("totalHoursOptimized")) localStorage.setItem("totalHoursOptimized", "0");
  checkWeekReset();
  if (!localStorage.getItem("weeklyActivity")) {
    localStorage.setItem("weeklyActivity", JSON.stringify({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }));
  }
  window.loadLanguageCards && window.loadLanguageCards();
  document.getElementById("back-btn").addEventListener("click", window.goBackToLanguages);
  document.getElementById("coding-back-btn").addEventListener("click", window.goBackToChallenges);
  window.loadUserProfile && window.loadUserProfile();
  updateProgressGraph();
  updateDailyGoalsCard();
  updateWeeklyActivityCard();
  updateWeeklyStatsCard();
  loadLeaderboard();
});

window.logout = function() {
  localStorage.removeItem("user");
  window.location.href = 'first_page.html';
};
