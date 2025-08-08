// js/main.js
import { fetchBreakingNews } from './breakingNews.js';
import { fetchCategories, fetchNews } from './news.js';
import { loadUserNotifications, toggleNotificationPanel } from './notifications.js';
import { auth } from './firebase-config.js';

// ✅ Apply persistent login before anything else
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth persistence set to LOCAL.");
  })
  .catch(error => {
    console.error("Auth persistence error:", error.message);
  });

document.addEventListener("DOMContentLoaded", () => {
  // Load initial data
  fetchBreakingNews();
  fetchCategories();
  fetchNews();

  // Track authentication state
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log("User is logged in:", user.uid);
      loadUserNotifications(user.uid);
      const commentSection = document.getElementById("commentSection");
      if (commentSection) commentSection.style.display = "block";
    } else {
      console.log("No user logged in.");
      const commentSection = document.getElementById("commentSection");
      if (commentSection) commentSection.style.display = "none";
    }
  });

  // Notification panel button handler
  const notifBtn = document.querySelector("[onclick='toggleNotificationPanel()']");
  if (notifBtn) {
    notifBtn.addEventListener("click", toggleNotificationPanel);
  }

  // Refresh breaking news every 10 seconds
  setInterval(fetchBreakingNews, 10000);
});
