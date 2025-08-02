import { db, auth } from './firebase-config.js';

export function loadUserNotifications(currentUserId) {
  const list = document.getElementById("userNotifications");
  const badge = document.getElementById("notifCount");
  const panel = document.getElementById("notifPanel");
  if (!list || !badge || !panel) {
    console.warn("🔔 Notification UI elements not found");
    return;
  }

  db.collection("user_notifications")
    .where("userId", "in", [currentUserId, "public"])
    .where("timestamp", "!=", null) // 🔥 Ensure timestamp exists for ordering
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
            <div onclick="window.openArticleAndMark('${doc.id}', '${d.articleId}')" style="cursor:pointer;">
              <strong>${d.title}</strong><br/>
              <small>${d.message}</small>
            </div>
            ${!d.isRead ? `<button class='btn btn-sm btn-outline-success' onclick="window.markAsRead('${doc.id}')">✓</button>` : ""}
          `;
          list.appendChild(div);
        });

        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? "inline-block" : "none";
        panel.style.display = snapshot.size > 0 ? "block" : "none"; // ✅ Show if any notifications exist
      }
    }, err => {
      list.innerHTML = `<div class="alert alert-danger">Error loading notifications: ${err.message}</div>`;
      panel.style.display = "none";
    });
}

window.markAsRead = function(notificationId) {
  db.collection("user_notifications").doc(notificationId).update({ isRead: true }).then(() => {
    const user = auth.currentUser;
    if (user) loadUserNotifications(user.uid);
  }).catch(err => {
    console.error("Error marking notification as read:", err);
    alert("Failed to mark notification as read: " + err.message);
  });
};

window.openArticleAndMark = function(notificationId, articleId) {
  window.markAsRead(notificationId);
  if (typeof window.showFullNews === "function") {
    window.showFullNews(articleId);
  } else {
    window.location.href = `article.html?id=${articleId}`;
  }
};

export function toggleNotificationPanel() {
  const panel = document.getElementById("notifPanel");
  if (panel) {
    panel.style.display = panel.style.display === "none" || panel.style.display === "" ? "block" : "none";
  }
}
