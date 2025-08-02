const firebaseConfig = {
  apiKey: "AIzaSyBzwTHxw6Y9opozv3AsjCvDQwLYoVB56YE",
  authDomain: "news-website-369.firebaseapp.com",
  projectId: "news-website-369",
  storageBucket: "news-website-369.firebasestorage.app",
  messagingSenderId: "653045591370",
  appId: "1:653045591370:web:7c3bff0cc9df76a563a5b3",
  measurementId: "G-MR1QM00EHP"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Set persistent auth session
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Persistence error:", err.message);
});

export { db, auth };
