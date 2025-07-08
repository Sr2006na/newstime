let isFullView = false;
const ITEMS_PER_PAGE = 6;

const firebaseConfig = {
  apiKey: "AIzaSyBzwTHxw6Y9opozv3AsjCvDQwLYoVB56YE",
  authDomain: "news-website-369.firebaseapp.com",
  projectId: "news-website-369",
  storageBucket: "news-website-369.appspot.com",
  messagingSenderId: "653045591370",
  appId: "1:653045591370:web:7c3bff0cc9df76a563a5b3"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
auth.signInAnonymously().catch(err => console.error("Anon login failed:", err));

async function fetchBreakingNews() {
  const tickerContent = document.getElementById("tickerContent");
  try {
    const doc = await db.collection("breaking").doc("latest").get();
    tickerContent.textContent = doc.exists && doc.data().text ? doc.data().text : "No breaking news available.";
  } catch (err) {
    console.error("Error fetching breaking news:", err);
    tickerContent.textContent = "Error loading breaking news.";
  }
}

async function loadTopStories() {
  const container = document.getElementById("topStoriesInner");
  container.innerHTML = '<div class="text-center p-4">Loading...</div>';
  try {
    const snapshot = await db.collection("news").orderBy("views", "desc").limit(5).get();
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = "<div class='text-center p-4'>No top stories available.</div>";
      return;
    }
    let first = true;
    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement("div");
      item.className = `carousel-item${first ? " active" : ""}`;
      item.innerHTML = `
        <div onclick="showFullNews('${doc.id}')" style="cursor: pointer;">
          <img src="${data.imageUrl}" class="d-block w-100" style="max-height: 400px; object-fit: cover;" alt="${data.title}">
          <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">
            <h5>${data.title}</h5>
            <p>${data.content.substring(0, 100)}...</p>
          </div>
        </div>
      `;
      container.appendChild(item);
      first = false;
    });
  } catch (err) {
    container.innerHTML = `<div class="text-danger text-center p-4">Error loading top stories: ${err.message}</div>`;
  }
}

async function fetchCategories() {
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

// Update View Count
function updateViewCount(articleId) {
  const viewedKey = `viewed_${articleId}`;
  const viewedToday = localStorage.getItem(viewedKey);
  const today = new Date().toDateString();

  if (viewedToday !== today) {
    db.collection("news").doc(articleId).update({
      views: firebase.firestore.FieldValue.increment(1)
    }).then(() => localStorage.setItem(viewedKey, today)).catch(console.warn);
  }
}

// Add preview in renderNewsArticles
function renderNewsArticles(snapshot, container, start, end) {
  container.innerHTML = "";
  const articles = snapshot.docs.slice(start, end);
  if (articles.length === 0) return container.innerHTML = "<p>No news found.</p>";
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
          <button class="btn btn-sm btn-primary" onclick="showFullNews('${doc.id}')">Read More</button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function renderPagination(totalPages, currentPage, fetchFunction, category = null) {
  const pagination = document.getElementById("pagination");
  if (isFullView || totalPages <= 1) {
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

async function fetchNews(page = 1) {
  const container = document.getElementById("newsContainer");
  isFullView = false;
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

async function fetchNewsByCategory(category, page = 1) {
  const container = document.getElementById("newsContainer");
  isFullView = false;
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

async function showFullNews(id) {
  isFullView = true;
  const container = document.getElementById("newsContainer");
  const topStories = document.getElementById("topStoriesCarousel");
  const categoryFilters = document.getElementById("categoryFilters");
  const sectionTitle = document.querySelector(".section-title");
  const pagination = document.getElementById("pagination");

  if (topStories) topStories.style.display = "none";
  if (categoryFilters) categoryFilters.style.display = "none";
  if (sectionTitle) sectionTitle.style.display = "none";
  if (pagination) {
    pagination.style.display = "none";
    pagination.innerHTML = "";
  }

  container.innerHTML = "<p>Loading article...</p>";
  try {
    const docRef = db.collection("news").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      container.innerHTML = "<p>Article not found.</p>";
      return;
    }

    // Increment views
    updateViewCount(id);

    const data = doc.data();
    const date = data.date?.toDate?.() || new Date();
    const commentSnap = await db.collection("news").doc(id).collection("comments").get();
    const commentCount = commentSnap.size;

    container.innerHTML = `
      <div class="full-news">
        <img src="${data.imageUrl}" class="full-img" alt="${data.title}">
        <h2>${data.title}</h2>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Date:</strong> ${date.toLocaleDateString()} | <strong>Time:</strong> ${date.toLocaleTimeString()}</p>
        <p><strong>Views:</strong> ${data.views + 1 || 1}</p>
        <p>${data.content}</p>
        <hr>
        <div class="article-footer mt-5">
          <div class="d-flex gap-3 flex-wrap mb-3">
            <a class="share-btn" href="https://api.whatsapp.com/send?text=${encodeURIComponent(data.title)}%20${location.href}" target="_blank">
              <i class="fab fa-whatsapp"></i>
            </a>
            <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${location.href}" target="_blank">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a class="share-btn" href="https://twitter.com/intent/tweet?url=${location.href}&text=${encodeURIComponent(data.title)}" target="_blank">
              <i class="fab fa-x-twitter"></i>
            </a>
            <a class="share-btn" href="mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.content)}%0A${location.href}">
              <i class="fas fa-envelope"></i>
            </a>
            <button class="share-btn" onclick="navigator.share?.({ title: '${data.title}', url: location.href })">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
          <div class="comments-section mt-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>${commentCount} comment${commentCount === 1 ? "" : "s"}</strong>
              <select class="form-select form-select-sm" style="width:auto" onchange="loadComments('${id}', this.value === 'Newest' ? 'desc' : 'asc')">
                <option>Newest</option>
                <option>Oldest</option>
              </select>
            </div>
            <div id="commentList"></div>
            <div class="card p-3 shadow-sm mt-3">
              <input type="text" class="form-control mb-2" placeholder="Your Name" id="commentName">
              <input type="email" class="form-control mb-2" placeholder="Your Email" id="commentEmail">
              <textarea class="form-control mb-2" placeholder="Add a comment..." rows="3" id="commentText"></textarea>
              <div class="text-end">
                <button class="btn btn-sm btn-primary" onclick="submitComment('${id}')">Send</button>
              </div>
            </div>
          </div>
        </div>
        <a href="#" class="btn btn-secondary mt-4" onclick="resetHomeView(event)">Back to Home</a>
      </div>
    `;
    loadComments(id, "desc");
  } catch (err) {
    container.innerHTML = `<p>Error loading article: ${err.message}</p>`;
  }
}

async function submitComment(articleId) {
  const name = document.getElementById("commentName").value.trim();
  const email = document.getElementById("commentEmail").value.trim();
  const text = document.getElementById("commentText").value.trim();

  if (!name || !email || !text) {
    alert("Please fill in all fields.");
    return;
  }

  const comment = {
    name,
    email,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("news").doc(articleId).collection("comments").add(comment);
    alert("Comment posted!");
    document.getElementById("commentName").value = "";
    document.getElementById("commentEmail").value = "";
    document.getElementById("commentText").value = "";
    loadComments(articleId, "desc");
  } catch (err) {
    console.error("Failed to post comment", err);
    alert("Failed to post comment: " + err.message);
  }
}

// Fix comment loading (ensure it pulls all comments)
async function loadComments(articleId, sort = "desc") {
  const listContainer = document.getElementById("commentList");
  if (!listContainer) return;

  try {
    const snapshot = await db.collection("news").doc(articleId).collection("comments").orderBy("timestamp", sort).get();
    if (snapshot.empty) return listContainer.innerHTML = "<p>No comments yet.</p>";

    listContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.timestamp?.toDate()?.toLocaleString() || "Just now";
      const div = document.createElement("div");
      div.className = "comment-item mb-3";
      div.innerHTML = `
        <strong>${d.name}</strong> <small class="text-muted">(${d.email})</small>
        <div class="text-muted small">${date}</div>
        <p class="mt-1 mb-0">${d.text}</p>`;
      listContainer.appendChild(div);
    });
  } catch (err) {
    listContainer.innerHTML = "<p>Error loading comments.</p>";
  }
}

function resetHomeView(e) {
  e.preventDefault();
  isFullView = false;
  fetchNews();
  document.getElementById("topStoriesCarousel").style.display = "";
  document.getElementById("categoryFilters").style.display = "";
  document.querySelector(".section-title").style.display = "";
  document.getElementById("pagination").style.display = "";
}

// Replace the loadUserNotifications function in main.js
function loadUserNotifications(currentUserId) {
    const list = document.getElementById("userNotifications");
    const badge = document.getElementById("notifCount");
    const panel = document.getElementById("notifPanel");
    if (!list || !badge || !panel) return;

    db.collection("user_notifications")
        .where("userId", "in", [currentUserId, "public"]) // Include public notifications
        .orderBy("timestamp", "desc")
        .limit(10)
        .onSnapshot(snapshot => {
            let unreadCount = 0;
            list.innerHTML = "";
            if (snapshot.empty) {
                list.innerHTML = "<div class='alert alert-light'>No notifications.</div>";
                panel.style.display = "none";
            } else {
                snapshot.forEach(doc => {
                    const d = doc.data();
                    if (!d.isRead) unreadCount++;
                    const div = document.createElement("div");
                    div.className = "alert alert-light border mb-2 d-flex justify-content-between align-items-center";
                    div.innerHTML = `
                        <div onclick="openArticleAndMark('${doc.id}', '${d.articleId}')" style="cursor:pointer;">
                            <strong>${d.title}</strong><br/>
                            <small>${d.message}</small>
                        </div>
                        ${!d.isRead ? `<button class='btn btn-sm btn-outline-success' onclick="markAsRead('${doc.id}')">✓</button>` : ""}
                    `;
                    list.appendChild(div);
                });
                panel.style.display = unreadCount > 0 ? "block" : "none";
            }
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? "inline-block" : "none";
        }, err => {
            list.innerHTML = `<div class="alert alert-danger">Error loading notifications: ${err.message}</div>`;
            panel.style.display = "none";
        });
}

// Replace the existing toggleNotificationPanel function in main.js
function toggleNotificationPanel() {
    const panel = document.getElementById("notifPanel");
    if (panel) {
        panel.style.display = panel.style.display === "none" || panel.style.display === "" ? "block" : "none";
    }
}


loadUserNotifications

// Replace the markAsRead function in main.js
function markAsRead(notificationId) {
    db.collection("user_notifications").doc(notificationId).update({ isRead: true }).then(() => {
        const user = firebase.auth().currentUser;
        if (user) loadUserNotifications(user.uid);
    }).catch(err => {
        console.error("Error marking notification as read:", err);
        alert("Failed to mark notification as read: " + err.message);
    });
}
// Replace the openArticleAndMark function in main.js
function openArticleAndMark(notificationId, articleId) {
    markAsRead(notificationId);
    showFullNews(articleId); // Use showFullNews for in-page navigation
}

// Replace the firebase.auth().onAuthStateChanged in main.js
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadUserNotifications(user.uid);
    } else {
        // Handle anonymous user case
        firebase.auth().signInAnonymously().then(userCredential => {
            loadUserNotifications(userCredential.user.uid);
        }).catch(err => console.error("Anon login failed:", err));
    }
});








fetchBreakingNews();
loadTopStories();
fetchNews();
fetchCategories();
setInterval(fetchBreakingNews, 10000);