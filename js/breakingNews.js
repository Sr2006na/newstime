// js/breakingNews.js
import { db } from './firebase-config.js';

export async function fetchBreakingNews() {
  const tickerContent = document.getElementById("tickerContent");
  try {
    const doc = await db.collection("breaking").doc("latest").get();
    tickerContent.textContent = doc.exists && doc.data().text
      ? doc.data().text
      : "No breaking news available.";
  } catch (err) {
    console.error("Error fetching breaking news:", err);
    tickerContent.textContent = "Error loading breaking news.";
  }
}




export function loadBreaking() {
  const current = document.getElementById("currentBreaking");
  db.collection("breaking").doc("latest").get().then(doc => {
    if (doc.exists) {
      document.getElementById("breakingText").value = doc.data().text;
      current.innerText = doc.data().text;
    } else {
      document.getElementById("breakingText").value = "";
      current.innerText = "None";
    }
  }).catch(() => {
    current.innerText = "Error loading breaking news.";
  });
}

export function setupBreakingForm() {
  const form = document.getElementById("breakingForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = document.getElementById("breakingText").value.trim();
    if (!text) return alert("Please enter breaking news text.");

    await db.collection("breaking").doc("latest").set({ text });
    alert("Breaking news updated.");
    loadBreaking();
  });

  const clearBtn = form?.querySelector("button[onclick]");
  clearBtn?.addEventListener("click", () => {
    db.collection("breaking").doc("latest").delete().then(loadBreaking).catch(err => {
      alert("Error clearing breaking news: " + err.message);
    });
  });
}
