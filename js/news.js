// js/news.js
import { db } from './firebase-config.js';
import { renderNewsArticles, renderPagination } from './viewer.js';

const ITEMS_PER_PAGE = 6;

export async function fetchCategories() {
  const categoryFilters = document.querySelector("#categoryFilters .d-flex");
  try {
    const snapshot = await db.collection("news").get();
    const categories = new Set(["All"]);
    snapshot.forEach(doc => categories.add(doc.data().category));
    categoryFilters.innerHTML = "";
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-primary category-btn";
      btn.innerText = cat;
      btn.onclick = () => cat === "All" ? fetchNews() : fetchNewsByCategory(cat);
      categoryFilters.appendChild(btn);
    });
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

export async function fetchNews(page = 1) {
  const container = document.getElementById("newsContainer");
  try {
    const snapshot = await db.collection("news").orderBy("date", "desc").get();
    const total = snapshot.docs.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    renderNewsArticles(snapshot, container, start, end);
    renderPagination(totalPages, page, (_, p) => fetchNews(p));
  } catch (err) {
    container.innerHTML = `<p>Error loading news: ${err.message}</p>`;
  }
}

export async function fetchNewsByCategory(category, page = 1) {
  const container = document.getElementById("newsContainer");
  try {
    const snapshot = await db.collection("news")
      .where("category", "==", category)
      .orderBy("date", "desc")
      .get();
    const total = snapshot.docs.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    renderNewsArticles(snapshot, container, start, end);
    renderPagination(totalPages, page, fetchNewsByCategory, category);
  } catch (err) {
    container.innerHTML = `<p>Error loading category: ${err.message}</p>`;
  }
}
