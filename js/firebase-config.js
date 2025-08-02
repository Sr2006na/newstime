// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBzwTHxw6Y9opozv3AsjCvDQwLYoVB56YE",
  authDomain: "news-website-369.firebaseapp.com",
  projectId: "news-website-369",
  storageBucket: "news-website-369.appspot.com", // fixed: was "firebasestorage.app"
  messagingSenderId: "653045591370",
  appId: "1:653045591370:web:7c3bff0cc9df76a563a5b3",
  measurementId: "G-MR1QM00EHP"
};

// ✅ Initialize Firebase app
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ✅ Set auth persistence to LOCAL so login persists across page reloads
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Auth persistence error:", err.message);
});

export { db, auth };
