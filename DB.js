const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://send-data-fbe55-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Define the updates you want to make. This example sets a student record with an empty solvedPerLanguage object.
const updates = {
  "students/PRN002": {
    fullName: "Sandesh Yelameli",
    password: "1234",
    branch: "Mechanical Engineering",
    photo: "https://example.com/photos/charlie.jpg",
    total_line_written: 0,
    timeSpent: 0,
    solvedChallenges: 0,
    solvedPerLanguage: {}   // Initially no solved challenges for any language.
  }/*,
  "faculty/FAC001": {
    fullName: "suraj pawar",
    password: "1234",
    branch: "Mechanical Engineering",
    photo: "https://example.com/photos/charlie.jpg",
    subject: "Circuit Analysis"
  }*/
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
