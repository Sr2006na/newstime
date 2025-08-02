// js/views.js
import { db } from './firebase-config.js';

export function updateViewCount(articleId) {
  const viewedKey = `viewed_${articleId}`;
  const viewedToday = localStorage.getItem(viewedKey);
  const today = new Date().toDateString();

  if (viewedToday !== today) {
    db.collection("news").doc(articleId).update({
      views: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
      localStorage.setItem(viewedKey, today);
    }).catch(console.warn);
  }
}
