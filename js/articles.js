// js/articles.js
import { db } from './firebase-config.js';
import { loadAnalytics } from './analytics.js';

let editId = null;

export function loadArticles() {
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
          <button class="btn btn-sm btn-warning me-2" onclick="window.editArticle('${doc.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="window.deleteArticle('${doc.id}')">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
  }).catch(err => {
    list.innerHTML = `<li class="list-group-item text-danger">Error loading articles: ${err.message}</li>`;
  });
}

export function setupArticleForm() {
  const form = document.getElementById("articleForm");
  form?.addEventListener("submit", async (e) => {
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
        await db.collection("user_notifications").add({
          articleId: docRef.id,
          title: "📰 New Article: " + data.title,
          message: "Check out the latest post now!",
          userId: "public",
          isRead: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Article added.");
      }

      editId = null;
      form.reset();
      document.getElementById("cancelEdit").style.display = "none";
      loadArticles();
      loadAnalytics();
    } catch (err) {
      alert("Error saving article: " + err.message);
    }
  });

  const cancelBtn = document.getElementById("cancelEdit");
  cancelBtn?.addEventListener("click", () => {
    form.reset();
    cancelBtn.style.display = "none";
    editId = null;
  });
}

// Attach functions to global window for inline buttons
window.editArticle = function(id) {
  db.collection("news").doc(id).get().then(doc => {
    const d = doc.data();
    document.getElementById("title").value = d.title;
    document.getElementById("content").value = d.content;
    document.getElementById("category").value = d.category;
    document.getElementById("imageUrl").value = d.imageUrl;
    editId = id;
    document.getElementById("cancelEdit").style.display = "inline-block";
  });
};

window.deleteArticle = function(id) {
  if (confirm("Delete this article?")) {
    db.collection("news").doc(id).delete().then(() => {
      loadArticles();
      loadAnalytics();
    }).catch(err => alert("Error deleting article: " + err.message));
  }
};
