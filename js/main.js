// js/main.js
import { fetchBreakingNews } from './breakingNews.js';
import { fetchCategories, fetchNews } from './news.js';
import { loadUserNotifications, toggleNotificationPanel } from './notifications.js';
import { auth } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", () => {
  fetchBreakingNews();
  fetchCategories();
  fetchNews();

  // ✅ Ensure anonymous login so users can comment and view notifications
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserNotifications(user.uid);
    } else {
      auth.signInAnonymously().then(userCred => {
        loadUserNotifications(userCred.user.uid);
      }).catch(err => {
        console.error("Anonymous login failed", err.message);
      });
    }
  });

  // Refresh breaking news every 10s
  setInterval(fetchBreakingNews, 10000);

  // Toggle notification panel when bell icon is clicked
  const notifBtn = document.querySelector("button[onclick*='toggleNotificationPanel']");
  notifBtn?.addEventListener("click", toggleNotificationPanel);
});
