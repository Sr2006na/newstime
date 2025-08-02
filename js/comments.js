// js/comments.js
import { db, auth } from './firebase-config.js';

let currentArticleId = window.currentArticleId || "REPLACE_THIS";

// 👤 Track login state once page loads
auth.onAuthStateChanged(user => {
  const form = document.getElementById("commentForm");
  const loginBtn = document.getElementById("loginToComment");

  if (user) {
    // User is signed in
    form?.classList.remove("d-none");
    loginBtn?.classList.add("d-none");
  } else {
    // Not signed in
    form?.classList.add("d-none");
    loginBtn?.classList.remove("d-none");
  }
});

// 🔐 Login with Google (popup)
window.loginToComment = async function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error("Login failed:", err.message);
    alert("Login failed: " + err.message);
  }
};

// 💬 Submit a comment
window.submitComment = async function (articleId) {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in to post a comment.");

  const text = document.getElementById("commentText").value.trim();
  if (!text || text.length < 3 || text.length > 1000) {
    alert("Comment must be between 3 and 1000 characters.");
    return;
  }

  const comment = {
    name: user.displayName || "Anonymous",
    email: user.email || "unknown",
    photo: user.photoURL || "",
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    uid: user.uid
  };

  try {
    await db.collection("news").doc(articleId).collection("comments").add(comment);
    document.getElementById("commentText").value = "";
    loadComments(articleId);
  } catch (err) {
    console.error("Failed to post comment", err);
    alert("Failed to post comment: " + err.message);
  }
};

// 📥 Load comments under an article
export async function loadComments(articleId, sort = "desc") {
  const listContainer = document.getElementById("commentList");
  if (!listContainer) return;

  try {
    const snapshot = await db.collection("news").doc(articleId)
      .collection("comments").orderBy("timestamp", sort).get();

    listContainer.innerHTML = snapshot.empty ? "<p>No comments yet.</p>" : "";

    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.timestamp?.toDate()?.toLocaleString() || "Just now";
      const div = document.createElement("div");
      div.className = "comment-item mb-3";
      div.innerHTML = `
        <div class="d-flex align-items-center mb-1">
          ${d.photo ? `<img src="${d.photo}" class="me-2" style="width:30px;height:30px;border-radius:50%;">` : ""}
          <strong>${d.name}</strong> <small class="text-muted">(${d.email})</small>
        </div>
        <div class="text-muted small">${date}</div>
        <p class="mt-1 mb-0">${d.text}</p>`;
      listContainer.appendChild(div);
    });
  } catch (err) {
    listContainer.innerHTML = "<p>Error loading comments.</p>";
    console.error("Error loading comments:", err);
  }
}

// 🛠️ Admin-only: Load all comments
export function loadAllComments() {
  const container = document.getElementById("commentModerationList");
  if (!container) return;
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
            <button class="btn btn-sm btn-danger" onclick="window.deleteComment('${articleId}', '${comment.id}')">Delete</button>
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

// ❌ Delete comment (admin only)
window.deleteComment = function (articleId, commentId) {
  if (confirm("Delete this comment?")) {
    db.collection("news").doc(articleId).collection("comments").doc(commentId)
      .delete().then(() => {
        loadAllComments();
      }).catch(err => {
        alert("Error deleting comment: " + err.message);
      });
  }
};
