const firebaseConfig = {
  apiKey: "AIzaSyBzwTHxw6Y9opozv3AsjCvDQwLYoVB56YE",
  authDomain: "news-website-369.firebaseapp.com",
  projectId: "news-website-369",
  storageBucket: "news-website-369.firebasestorage.app",
  messagingSenderId: "653045591370",
  appId: "1:653045591370:web:7c3bff0cc9df76a563a5b3",
  measurementId: "G-MR1QM00EHP"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let editId = null;

// Theme Toggle
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
});

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginResult = document.getElementById("loginResult");

  if (!loginResult) {
    console.error("Login result element not found");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    loginResult.innerHTML = "<div class='alert alert-success'>Login successful!</div>";
    loadArticles();
    loadBreaking();
    loadAnalytics();
    loadAllComments();
    loadUserNotifications(auth.currentUser.uid);
  } catch (err) {
    loginResult.innerHTML = `<div class='alert alert-danger'>Login failed: ${err.message}</div>`;
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  auth.signOut().then(() => location.reload());
});

// Article Preview
function previewArticle() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const category = document.getElementById("category").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();

  if (!title || !content || !category || !imageUrl) {
    alert("Please fill in all fields to preview.");
    return;
  }

  const previewContent = document.getElementById("previewContent");
  previewContent.innerHTML = `
    <img src="${imageUrl}" class="full-img" alt="${title}">
    <h2>${title}</h2>
    <p><strong>Category:</strong> ${category}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p>${content}</p>
  `;
  const modal = new bootstrap.Modal(document.getElementById("previewModal"));
  modal.show();
}

// Articles
// Replace the article submission event listener in admin.js
document.getElementById("articleForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("title").value.trim(),
        content: document.getElementById("content").value.trim(),
        category: document.getElementById("category").value.trim(),
        imageUrl: document.getElementById("imageUrl").value.trim(),
        date: new Date(),
        views: editId ? (await db.collection("news").doc(editId).get()).data().views || 0 : 0
    };

    try {
        if (editId) {
            await db.collection("news").doc(editId).update(data);
            alert("Article updated.");
        } else {
            const docRef = await db.collection("news").add(data);
            // Create a public notification for all users
            await db.collection("user_notifications").add({
                articleId: docRef.id,
                title: data.title,
                message: `📰 New article: ${data.title}`,
                userId: "public", // Public notification accessible to all
                isRead: false,
                timestamp: new Date()
            });
            alert("Article added.");
        }

        editId = null;
        document.getElementById("articleForm").reset();
        document.getElementById("cancelEdit").style.display = "none";
        loadArticles();
        loadAnalytics();
    } catch (err) {
        alert("Error saving article: " + err.message);
    }
});
function cancelEdit() {
  document.getElementById("articleForm").reset();
  document.getElementById("cancelEdit").style.display = "none";
  editId = null;
}

function loadArticles() {
  const list = document.getElementById("articleList");
  list.innerHTML = "Loading...";
  db.collection("news").orderBy("date", "desc").get().then(snapshot => {
    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = "<li class='list-group-item'>No articles found.</li>";
      return;
    }
    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${d.title}</strong><br>
          <small>${d.category} | Views: ${d.views || 0}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-warning me-2" onclick="editArticle('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteArticle('${doc.id}')">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
  }).catch(err => {
    list.innerHTML = `<li class="list-group-item text-danger">Error loading articles: ${err.message}</li>`;
  });
}

function editArticle(id) {
  db.collection("news").doc(id).get().then(doc => {
    const d = doc.data();
    document.getElementById("title").value = d.title;
    document.getElementById("content").value = d.content;
    document.getElementById("category").value = d.category;
    document.getElementById("imageUrl").value = d.imageUrl;
    editId = id;
    document.getElementById("cancelEdit").style.display = "inline-block";
  });
}

function deleteArticle(id) {
  if (confirm("Delete this article?")) {
    db.collection("news").doc(id).delete().then(() => {
      loadArticles();
      loadAnalytics();
    }).catch(err => alert("Error deleting article: " + err.message));
  }
}

// Notifications
// Replace the existing loadUserNotifications function in admin.js
function loadUserNotifications(userId) {
    const list = document.getElementById("userNotifications");
    const badge = document.getElementById("notifCount");
    if (!list || !badge) return;

    db.collection("user_notifications")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .onSnapshot(snapshot => {
            let unread = 0;
            list.innerHTML = "";
            if (snapshot.empty) {
                list.innerHTML = "<div class='alert alert-light'>No notifications.</div>";
            }
            snapshot.forEach(doc => {
                const d = doc.data();
                if (!d.isRead) unread++;
                const div = document.createElement("div");
                div.className = "alert alert-light border mb-1 d-flex justify-content-between align-items-center";
                div.innerHTML = `
                    <div onclick="openArticleAndMark('${doc.id}', '${d.articleId}')" style="cursor:pointer;">
                        <strong>${d.title}</strong><br/>
                        <small>${d.message}</small>
                    </div>
                    ${!d.isRead ? `<button class='btn btn-sm btn-outline-primary' onclick="markAsRead('${doc.id}')">✓</button>` : ""}
                `;
                list.appendChild(div);
            });
            badge.textContent = unread;
            badge.style.display = unread > 0 ? "inline-block" : "none";
        }, err => {
            list.innerHTML = `<div class="alert alert-danger">Error loading notifications: ${err.message}</div>`;
        });
}

function markAsRead(notifId) {
  db.collection("user_notifications").doc(notifId).update({ isRead: true }).catch(err => {
    alert("Error marking notification as read: " + err.message);
  });
}

function openArticleAndMark(notifId, articleId) {
  markAsRead(notifId);
  window.location.href = `article.html?id=${articleId}`;
}

// Replace the existing toggleNotificationPanel function in admin.js
function toggleNotificationPanel() {
    const panel = document.getElementById("notifPanel");
    if (panel) {
        panel.style.display = panel.style.display === "none" || panel.style.display === "" ? "block" : "none";
    }
}

// Breaking News
document.getElementById("breakingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("breakingText").value.trim();
  if (!text) {
    alert("Please enter breaking news text.");
    return;
  }
  await db.collection("breaking").doc("latest").set({ text });
  alert("Breaking news updated.");
  loadBreaking();
});

function clearBreaking() {
  db.collection("breaking").doc("latest").delete().then(loadBreaking).catch(err => {
    alert("Error clearing breaking news: " + err.message);
  });
}

function loadBreaking() {
  db.collection("breaking").doc("latest").get().then(doc => {
    const currentBreaking = document.getElementById("currentBreaking");
    if (doc.exists) {
      document.getElementById("breakingText").value = doc.data().text;
      currentBreaking.innerText = doc.data().text;
    } else {
      document.getElementById("breakingText").value = "";
      currentBreaking.innerText = "None";
    }
  }).catch(err => {
    document.getElementById("currentBreaking").innerText = "Error loading breaking news.";
  });
}

// Analytics
function loadAnalytics() {
  const totalViewsElem = document.getElementById("totalViews");
  const categoryCanvas = document.getElementById("categoryChart");
  const dailyCanvas = document.getElementById("dailyChart");

  if (!categoryCanvas || !dailyCanvas || !totalViewsElem) return;

  db.collection("news").get().then(snapshot => {
    let views = 0;
    const categories = {};
    const days = {};

    snapshot.forEach(doc => {
      const d = doc.data();
      views += d.views || 0;
      const cat = d.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
      const date = d.date && typeof d.date.toDate === "function"
        ? d.date.toDate().toLocaleDateString()
        : "Unknown";
      days[date] = (days[date] || 0) + (d.views || 0);
    });

    totalViewsElem.innerText = views;

    if (window.categoryChartObj) window.categoryChartObj.destroy();
    if (window.dailyChartObj) window.dailyChartObj.destroy();

    window.categoryChartObj = new Chart(categoryCanvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"]
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    window.dailyChartObj = new Chart(dailyCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: Object.keys(days),
        datasets: [{
          data: Object.values(days),
          label: "Views",
          backgroundColor: "#0dcaf0"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  }).catch(err => {
    totalViewsElem.innerText = "Error";
    console.error("Error loading analytics:", err);
  });
}

// Comment Moderation
function loadAllComments() {
  const container = document.getElementById("commentModerationList");
  container.innerHTML = "Loading...";

  db.collection("news").get().then(async snapshot => {
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = "<div class='alert alert-light'>No comments found.</div>";
      return;
    }

    for (const doc of snapshot.docs) {
      const articleId = doc.id;
      const articleData = doc.data();
      const commentSnap = await db.collection("news").doc(articleId)
        .collection("comments").orderBy("timestamp", "desc").get();

      if (commentSnap.empty) continue;

      commentSnap.forEach(comment => {
        const data = comment.data();
        const date = data.timestamp?.toDate()?.toLocaleString() || "Just now";
        const div = document.createElement("div");
        div.className = "border p-2 mb-2 rounded bg-light";
        div.innerHTML = `
          <strong>${data.name}</strong> <small class="text-muted">(${data.email})</small>
          <div class="text-muted small">${date}</div>
          <p>${data.text}</p>
          <small class="text-muted">Article: ${articleData.title}</small>
          <div class="mt-1">
            <button class="btn btn-sm btn-danger" onclick="deleteComment('${articleId}', '${comment.id}')">Delete</button>
          </div>
        `;
        container.appendChild(div);
      });
    }

    if (container.innerHTML === "") {
      container.innerHTML = "<div class='alert alert-light'>No comments found.</div>";
    }
  }).catch(err => {
    container.innerHTML = `<div class="alert alert-danger">Error loading comments: ${err.message}</div>`;
  });
}

function deleteComment(articleId, commentId) {
  if (confirm("Delete this comment?")) {
    db.collection("news").doc(articleId).collection("comments").doc(commentId).delete().then(() => {
      loadAllComments();
    }).catch(err => {
      alert("Error deleting comment: " + err.message);
    });
  }
}