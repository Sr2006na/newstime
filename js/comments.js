// js/comments.js
import { db, auth } from './firebase-config.js';

let currentArticleId = window.currentArticleId || "REPLACE_THIS";

// 🚫 Blocked disposable email domains
const disposableDomains = [
  "mailinator.com", "yopmail.com", "tempmail.com", "tempmail.org",
  "10minutemail.com", "guerrillamail.com", "throwawaymail.com",
  "getnada.com", "trashmail.com"
];

// Check if email is disposable
function isDisposableEmail(email) {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// 🔐 Track login state
auth.onAuthStateChanged(user => {
  const formWrapper = document.getElementById("commentFormWrapper");
  const loginPrompt = document.getElementById("loginPrompt");

  if (user) {
    if (isDisposableEmail(user.email)) {
      alert("Temporary/disposable emails are not allowed. Please use a valid email.");
      auth.signOut();
      return;
    }
    formWrapper?.classList.remove("d-none");
    loginPrompt?.classList.add("d-none");
    if (currentArticleId !== "REPLACE_THIS") {
      loadComments(currentArticleId);
    }
  } else {
    formWrapper?.classList.add("d-none");
    loginPrompt?.classList.remove("d-none");
  }
});

// 🔐 Google Sign In with persistence
window.loginToComment = async function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const result = await auth.signInWithPopup(provider);
    const email = result.user.email;
    if (isDisposableEmail(email)) {
      alert("Temporary/disposable emails are not allowed. Please use a valid email.");
      await auth.signOut();
    }
  } catch (err) {
    alert("Login failed: " + err.message);
  }
};

// 💬 Submit comment
window.submitComment = async function (articleId) {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in to post a comment.");

  if (isDisposableEmail(user.email)) {
    return alert("Temporary/disposable emails are not allowed to post comments.");
  }

  const text = document.getElementById("commentText").value.trim();
  if (!text || text.length < 3 || text.length > 1000) {
    alert("Comment must be between 3 and 1000 characters.");
    return;
  }

  const comment = {
    name: user.displayName || "Anonymous",
    email: user.email || "unknown",
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    photo: user.photoURL || "",
    uid: user.uid
  };

  try {
    await db.collection("news").doc(articleId).collection("comments").add(comment);
    document.getElementById("commentText").value = "";
    loadComments(articleId);
  } catch (err) {
    alert("Failed to post comment: " + err.message);
  }
};

// 📥 Load comments
export async function loadComments(articleId, sort = "desc") {
  const listContainer = document.getElementById("commentList");
  if (!listContainer) return;

  try {
    const snapshot = await db.collection("news").doc(articleId)
      .collection("comments").orderBy("timestamp", sort).get();

    listContainer.innerHTML = snapshot.empty
      ? "<p class='text-muted'>No comments yet. Be the first to comment!</p>"
      : "";

    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.timestamp?.toDate()?.toLocaleString() || "Just now";
      const avatar = d.photo || "default-avatar.png";

      const commentHTML = `
        <div class="comment">
          <img src="${avatar}" alt="avatar">
          <div class="comment-body">
            <div>
              <span class="comment-name">${d.name}</span>
              <span class="comment-date">• ${date}</span>
            </div>
            <div>${d.text}</div>
          </div>
        </div>
      `;
      listContainer.insertAdjacentHTML("beforeend", commentHTML);
    });
  } catch (err) {
    listContainer.innerHTML = "<p class='text-danger'>Error loading comments.</p>";
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
