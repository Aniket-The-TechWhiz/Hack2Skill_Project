document.addEventListener('DOMContentLoaded', function() {
  // Check if the user is already logged in
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user && user.role) {
      if (user.role === 'student') {
        window.location.href = 'code.html';
        return; // Stop executing further
      } else if (user.role === 'faculty') {
        window.location.href = 'institutedash.html';
        return; // Stop executing further
      }
    }
  }

  // Initialize Firebase using your configuration
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

  // Use try-catch to prevent duplicate initialization errors
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    if (!/already exists/.test(e.message)) {
      console.error("Firebase initialization error", e.stack);
    }
  }

  
  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  if (!loginBtn) {
    console.error("loginBtn not found!");
  } else {
    console.log("loginBtn found:", loginBtn);
  }
  if (!loginModal) {
    console.error("loginModal not found!");
  } else {
    console.log("loginModal found:", loginModal);
  }


  loginBtn.addEventListener('click', function() {
    console.log("loginBtn clicked");
    loginModal.style.display = 'block';
  });


  const closeModal = document.querySelector('.close');
  closeModal.addEventListener('click', function() {
    loginModal.style.display = 'none';
  });
  window.addEventListener('click', function(e) {
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
    }
  });

  // Tab toggling for Student / Faculty forms
  const studentTab = document.getElementById('studentTab');
  const facultyTab = document.getElementById('facultyTab');
  const studentForm = document.getElementById('studentForm');
  const facultyForm = document.getElementById('facultyForm');
  studentTab.addEventListener('click', function() {
    studentTab.classList.add('active');
    facultyTab.classList.remove('active');
    studentForm.classList.add('active');
    facultyForm.classList.remove('active');
  });
  facultyTab.addEventListener('click', function() {
    facultyTab.classList.add('active');
    studentTab.classList.remove('active');
    facultyForm.classList.add('active');
    studentForm.classList.remove('active');
  });

  // Student password toggle
  const toggleStudentPassword = document.getElementById('toggleStudentPassword');
  const studentPasswordInput = document.getElementById('studentPassword');
  toggleStudentPassword.addEventListener('click', function() {
    if (studentPasswordInput.type === 'password') {
      studentPasswordInput.type = 'text';
      this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      studentPasswordInput.type = 'password';
      this.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
  });

  // Faculty password toggle
  const toggleFacultyPassword = document.getElementById('toggleFacultyPassword');
  const facultyPasswordInput = document.getElementById('facultyPassword');
  toggleFacultyPassword.addEventListener('click', function() {
    if (facultyPasswordInput.type === 'password') {
      facultyPasswordInput.type = 'text';
      this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      facultyPasswordInput.type = 'password';
      this.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
  });

  // --- Student Login Verification ---
  document.querySelector('#studentForm form').addEventListener('submit', function(e) {
    e.preventDefault();
    const prn = document.getElementById('prn').value;
    const password = document.getElementById('studentPassword').value;
    
    firebase.database().ref('students/' + prn).once('value')
      .then(function(snapshot) {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.password === password) {
            localStorage.setItem('user', JSON.stringify({
              id: prn,
              fullName: userData.fullName || prn,
              role: 'student'
            }));
            window.location.href = 'student_dashboard.html';
          } else {
            alert("Incorrect password");
          }
        } else {
          alert("User not found");
        }
      })
      .catch(function(error) {
        console.error("Error verifying student:", error);
        alert("Error: " + error.message);
      });
  });

  // --- Faculty Login Verification ---
  document.querySelector('#facultyForm form').addEventListener('submit', function(e) {
    e.preventDefault();
    const facultyId = document.getElementById('facultyId').value;
    const password = document.getElementById('facultyPassword').value;
    
    firebase.database().ref('faculty/' + facultyId).once('value')
      .then(function(snapshot) {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.password === password) {
            localStorage.setItem('user', JSON.stringify({
              id: facultyId,
              fullName: userData.fullName || facultyId,
              role: 'faculty',
              photo: userData.photo || '',
              department: userData.branch || "N/A"
            }));
            console.log("Faculty login successful. Redirecting to instdashboard.html");
            window.location.href = 'institutedash.html';
          } else {
            alert("Incorrect password");
          }
        } else {
          alert("User not found");
        }
      })
      .catch(function(error) {
        console.error("Error verifying faculty:", error);
        alert("Error: " + error.message);
      });
  });
});
