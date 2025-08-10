// js/viewer.js
import { db } from './firebase-config.js';
import { updateViewCount } from './views.js';
import { loadComments } from './comments.js';

export function renderNewsArticles(snapshot, container, start, end) {
  container.innerHTML = "";
  const articles = snapshot.docs.slice(start, end);
  if (articles.length === 0) {
    container.innerHTML = "<p>No news found.</p>";
    return;
  }

  articles.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "col-md-4";
    div.innerHTML = `
      <div class="news-card">
        <img src="${d.imageUrl}" alt="${d.title}" style="object-fit:cover;height:180px;width:100%;">
        <div class="news-card-body">
          <h5>${d.title}</h5>
          <p class="small text-muted">${d.date.toDate().toLocaleDateString()} | ${d.category}</p>
          <p>${d.content.substring(0, 100)}...</p>
          <button class="btn btn-sm btn-primary" onclick="window.showFullNews('${doc.id}')">Read More</button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

export function renderPagination(totalPages, currentPage, fetchFunction, category = null) {
  const pagination = document.getElementById("pagination");
  if (totalPages <= 1) {
    pagination.style.display = "none";
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = "";
  pagination.style.display = "flex";

  const nav = document.createElement("nav");
  const ul = document.createElement("ul");
  ul.className = "pagination flex-wrap";

  const createItem = (label, page, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.innerText = label;
    if (!disabled && !active) {
      a.onclick = (e) => {
        e.preventDefault();
        fetchFunction(category, page);
      };
    }
    li.appendChild(a);
    return li;
  };

  ul.appendChild(createItem("«", currentPage - 1, currentPage === 1));
  for (let i = 1; i <= totalPages; i++) {
    ul.appendChild(createItem(i, i, false, i === currentPage));
  }
  ul.appendChild(createItem("»", currentPage + 1, currentPage === totalPages));

  nav.appendChild(ul);
  pagination.appendChild(nav);
}

window.showFullNews = async function(id) {
  const container = document.getElementById("newsContainer");
  const topStories = document.getElementById("topStoriesCarousel");
  const categoryFilters = document.getElementById("categoryFilters");
  const sectionTitle = document.querySelector(".section-title");
  const pagination = document.getElementById("pagination");

  topStories?.style.setProperty("display", "none");
  categoryFilters?.style.setProperty("display", "none");
  sectionTitle?.style.setProperty("display", "none");
  pagination.innerHTML = "";
  pagination.style.display = "none";

  container.innerHTML = "<p>Loading article...</p>";

  try {
    const doc = await db.collection("news").doc(id).get();
    if (!doc.exists) {
      container.innerHTML = "<p>Article not found.</p>";
      return;
    }

    const data = doc.data();
    updateViewCount(id);
    const date = data.date?.toDate?.() || new Date();

    // Set currentArticleId globally so comment script can use it
    window.currentArticleId = id;

    container.innerHTML = `
      <div class="full-news">
        <img src="${data.imageUrl}" class="full-img" alt="${data.title}">
        <h2>${data.title}</h2>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Date:</strong> ${date.toLocaleDateString()} | <strong>Time:</strong> ${date.toLocaleTimeString()}</p>
        <p><strong>Views:</strong> ${data.views + 1 || 1}</p>
        <p>${data.content}</p>
        <hr>
        
        <div class="comments-section mt-4">
          <strong>Comments</strong>
          <div id="commentList" class="mb-3"></div>

          <div id="loginPrompt" class="alert alert-info">
            <button class="btn btn-primary" onclick="loginToComment()">Sign in with Google to Comment</button>
          </div>

          <div id="commentFormWrapper" class="d-none mb-3">
            <textarea id="commentText" class="form-control mb-2" rows="3" placeholder="Write your comment..."></textarea>
            <button class="btn btn-success" onclick="submitComment('${id}')">Post Comment</button>
          </div>
        </div>

        <a href="#" class="btn btn-secondary mt-4" onclick="window.resetHomeView(event)">Back to Home</a>
      </div>
    `;

    loadComments(id, "desc");

  } catch (err) {
    container.innerHTML = `<p>Error loading article: ${err.message}</p>`;
  }
};

window.resetHomeView = function(e) {
  e.preventDefault();
  location.reload(); // reload is cleaner for resetting views
};
