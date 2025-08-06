const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://send-data-fbe55-default-rtdb.firebaseio.com"
});

const db = admin.database();


const updates = {
  "students/PRN002": {
    fullName: "Sandesh Yelameli",
    password: "1234",
    branch: "Mechanical Engineering",
    photo: "https://example.com/photos/charlie.jpg",
    total_line_written: 0,
    timeSpent: 0,
    solvedChallenges: 0,
    solvedPerLanguage: {}   
  }
};

db.ref().update(updates)
  .then(() => {
    console.log("Database updated successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error updating database:", error);
    process.exit(1);
  });
