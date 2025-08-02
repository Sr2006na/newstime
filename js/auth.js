// js/auth.js
import { auth } from './firebase-config.js';
import { loadArticles } from './articles.js';
import { loadAnalytics } from './analytics.js';
import { loadBreaking } from './breakingNews.js';
import { loadAllComments } from './comments.js';
import { loadUserNotifications } from './notifications.js';

export function setupLoginForm() {
  const form = document.getElementById("loginForm");
  const result = document.getElementById("loginResult");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await auth.signInWithEmailAndPassword(email, password);
      document.getElementById("loginSection").style.display = "none";
      document.getElementById("adminSection").style.display = "block";
      result.innerHTML = `<div class='alert alert-success'>Login successful!</div>`;
      loadArticles();
      loadAnalytics();
      loadBreaking();
      loadAllComments();
      loadUserNotifications(auth.currentUser.uid);
    } catch (err) {
      result.innerHTML = `<div class='alert alert-danger'>Login failed: ${err.message}</div>`;
    }
  });
}

export function setupLogout() {
  const btn = document.getElementById("logoutButton");
  btn?.addEventListener("click", () => {
    auth.signOut().then(() => location.reload());
  });
}
