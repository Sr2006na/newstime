// js/main.js
import { fetchBreakingNews } from './breakingNews.js';
import { fetchCategories, fetchNews } from './news.js';
import { loadUserNotifications, toggleNotificationPanel } from './notifications.js';
import { auth } from './firebase-config.js';

// Ensure persistent login
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(error => {
    console.error("Auth persistence error:", error.message);
  });

document.addEventListener("DOMContentLoaded", () => {
  // Initial data loads
  fetchBreakingNews();
  fetchCategories();
  fetchNews();

  // Monitor login state
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log("User logged in:", user.uid);
      loadUserNotifications(user.uid);

      // Show comment section if exists
      const commentSection = document.getElementById("commentSection");
      if (commentSection) {
        commentSection.style.display = "block";
      }
    } else {
      console.log("User logged out");

      // Hide comment section
      const commentSection = document.getElementById("commentSection");
      if (commentSection) {
        commentSection.style.display = "none";
      }
    }
  });

  // Notification panel button
  const notifBtn = document.querySelector("[onclick='toggleNotificationPanel()']");
  if (notifBtn) {
    notifBtn.addEventListener("click", toggleNotificationPanel);
  }

  // Refresh breaking news every 10 seconds
  setInterval(fetchBreakingNews, 10000);
});
