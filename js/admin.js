// js/admin.js
import { loadTheme, toggleTheme } from './theme.js';
import { setupLoginForm, setupLogout } from './auth.js';
import { setupArticleForm } from './articles.js';
import { setupBreakingForm } from './breakingNews.js';

// Apply theme from localStorage
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  setupLoginForm();
  setupLogout();
  setupArticleForm();
  setupBreakingForm();
  
  

  const themeToggleBtn = document.querySelector(".toggle-theme");
  themeToggleBtn?.addEventListener("click", toggleTheme);
});
