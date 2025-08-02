// js/analytics.js
import { db } from './firebase-config.js';

export function loadAnalytics() {
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

    // Cleanup previous charts
    if (window.categoryChartObj) window.categoryChartObj.destroy();
    if (window.dailyChartObj) window.dailyChartObj.destroy();

    // Draw Category Chart
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

    // Draw Daily Views Chart
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
