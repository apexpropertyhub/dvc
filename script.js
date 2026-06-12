/* ===== Apex Property Hub — Digital Visiting Card ===== */

/* ---------- 1. Animated view counter ---------- */
(function () {
  // persist a base view count in localStorage so it grows each visit
  let views = parseInt(localStorage.getItem("apexViews") || "500", 10) + 1;
  localStorage.setItem("apexViews", views);

  const el = document.getElementById("viewCount");
  let n = Math.max(0, views - 120);
  const step = () => {
    n += Math.ceil((views - n) / 12);
    if (n >= views) n = views;
    el.textContent = n.toLocaleString();
    if (n < views) requestAnimationFrame(step);
  };
  step();
})();

/* ---------- 2. Brochures ----------
   PDFs live in the /brochures folder. To add a new one:
   1) Drop the PDF file into the brochures/ folder.
   2) Add an entry to brochures/brochures.json  ->  { "title": "...", "file": "yourfile.pdf" }
   The list below is built automatically from that manifest, and works on GitHub Pages. */
const brochureList = document.getElementById("brochureList");

function renderBrochures(items) {
  brochureList.innerHTML = "";
  if (!items.length) {
    brochureList.innerHTML = `<p style="font-size:14px;color:#6b7280">No brochures available yet.</p>`;
    return;
  }
  items.forEach(({ title, file }) => {
    const url = "brochures/" + file;
    const row = document.createElement("div");
    row.className = "brochure-item";
    row.innerHTML = `
      <i class="fa-solid fa-file-pdf"></i>
      <span class="name">${title}</span>
      <a href="${url}" download title="Download ${title}">
        <i class="fa-solid fa-circle-down"></i>
      </a>`;
    brochureList.appendChild(row);
  });
}

fetch("brochures/brochures.json", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then(renderBrochures)
  .catch(() => {
    brochureList.innerHTML =
      `<p style="font-size:14px;color:#6b7280">Could not load brochures. ` +
      `Make sure brochures/brochures.json exists.</p>`;
  });

/* ---------- 3. Gallery (uses placeholder tiles) ---------- */
const galleryGrid = document.getElementById("galleryGrid");
const galleryColors = ["1b9dd9", "16a394", "4cb6e0", "1483b8", "2bb3a3", "5cc0d8", "1b9dd9", "16a394", "4cb6e0"];
galleryColors.forEach((c, i) => {
  const img = document.createElement("img");
  img.src = `https://placehold.co/300x300/${c}/ffffff?text=Project+${i + 1}`;
  img.alt = `Gallery image ${i + 1}`;
  img.loading = "lazy";
  galleryGrid.appendChild(img);
});

/* ---------- 4. Feedbacks ---------- */
const feedbacks = [
  { name: "Rahul Mehta", date: "Jan 18, 2026", rating: 5, text: "Excellent guidance for commercial office space. Very professional and trustworthy." },
  { name: "Priya Shah", date: "Feb 02, 2026", rating: 5, text: "Found my dream home with their help. Smooth and transparent dealing." },
  { name: "Amit Patel", date: "Mar 11, 2026", rating: 4, text: "Good service and quick responses. Highly recommended." },
  { name: "Nisha Desai", date: "Apr 27, 2026", rating: 5, text: "Very honest team. Given all the guidance for property purchase." },
];

const feedbackList = document.getElementById("feedbackList");
function starHtml(r) {
  return "★".repeat(r) + "☆".repeat(5 - r);
}
function renderFeedbacks() {
  feedbackList.innerHTML = "";
  feedbacks.forEach((f) => {
    const item = document.createElement("div");
    item.className = "feedback-item";
    item.innerHTML = `
      <div class="feedback-head">
        <span class="fname">${f.name}</span>
        <span class="fdate">on ${f.date}</span>
      </div>
      <div class="feedback-stars">${starHtml(f.rating)}</div>
      <p class="ftext">${f.text}</p>`;
    feedbackList.appendChild(item);
  });
}
renderFeedbacks();

/* ---------- 5. Star rating picker ---------- */
let selectedRating = 0;
const stars = document.querySelectorAll("#ratingStars i");
function paintStars(v) {
  stars.forEach((s) => {
    const on = Number(s.dataset.v) <= v;
    s.className = on ? "fa-solid fa-star" : "fa-regular fa-star";
  });
}
stars.forEach((s) => {
  s.addEventListener("mouseenter", () => paintStars(Number(s.dataset.v)));
  s.addEventListener("click", () => {
    selectedRating = Number(s.dataset.v);
    paintStars(selectedRating);
  });
});
document.getElementById("ratingStars").addEventListener("mouseleave", () => paintStars(selectedRating));

/* ---------- 6. Feedback form ---------- */
document.getElementById("feedbackForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("fbName").value.trim();
  const text = document.getElementById("fbText").value.trim();
  if (!selectedRating) return alert("Please select a rating.");
  feedbacks.unshift({
    name,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    rating: selectedRating,
    text,
  });
  renderFeedbacks();
  e.target.reset();
  selectedRating = 0;
  paintStars(0);
  alert("Thank you for your feedback!");
});

/* ---------- 7. Share on WhatsApp ---------- */
document.getElementById("shareForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const num = document.getElementById("shareNumber").value.trim();
  if (!/^\d{10}$/.test(num)) return alert("Please enter a valid 10-digit mobile number.");
  const msg = encodeURIComponent("Check out Apex Property Hub digital card: " + window.location.href);
  window.open(`https://wa.me/91${num}?text=${msg}`, "_blank");
});

/* ---------- 8. Inquiry form ---------- */
// Paste your Google Apps Script Web App URL here (the .../exec link).
const INQUIRY_ENDPOINT = "https://script.google.com/macros/s/AKfycbxa8a-a47LSSRxQz9_qQupEtOKF3PEiIeU3ZWCaPNPUVJ6a8YJbikWHlTRjf2FwPsTsHg/exec";

// Category options that depend on the selected Type.
const inquiryCategories = {
  Buy: ["Commercial", "Residential", "Land"],
  Sell: ["Commercial", "Residential", "Land"],
  Rent: ["Commercial", "Residential"],
};

const categoryRow = document.getElementById("inqCategoryRow");
const categoryOptions = document.getElementById("inqCategoryOptions");

// When a Type is chosen, rebuild the Category radios and reveal the row.
document.querySelectorAll('input[name="inqType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const options = inquiryCategories[radio.value] || [];
    categoryOptions.innerHTML = options
      .map(
        (c) =>
          `<label><input type="radio" name="inqCategory" value="${c}" required /> ${c}</label>`
      )
      .join("");
    categoryRow.hidden = false;
  });
});

document.getElementById("inquiryForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const typeEl = document.querySelector('input[name="inqType"]:checked');
  const categoryEl = document.querySelector('input[name="inqCategory"]:checked');
  const payload = {
    name: document.getElementById("inqName").value.trim(),
    phone: document.getElementById("inqPhone").value.trim(),
    email: document.getElementById("inqEmail").value.trim(),
    type: typeEl ? typeEl.value : "",
    category: categoryEl ? categoryEl.value : "",
    message: document.getElementById("inqMessage").value.trim(),
  };

  const btn = document.getElementById("inqSubmitBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending…";

  fetch(INQUIRY_ENDPOINT, {
    method: "POST",
    // Apps Script web apps don't return CORS headers, so we send as a simple
    // request. The row is still saved; we just can't read the response body.
    body: JSON.stringify(payload),
  })
    .then(() => {
      alert("Thank you! Your inquiry has been submitted. We will contact you soon.");
      e.target.reset();
      categoryOptions.innerHTML = "";
      categoryRow.hidden = true;
    })
    .catch(() => {
      alert("Sorry, something went wrong. Please try again later.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = originalText;
    });
});

/* ---------- 9. Bottom-nav active state on scroll ---------- */
const navItems = document.querySelectorAll(".nav-item");
const navMap = {};
navItems.forEach((a) => (navMap[a.getAttribute("href").slice(1)] = a));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && navMap[en.target.id]) {
        navItems.forEach((n) => n.classList.remove("active"));
        navMap[en.target.id].classList.add("active");
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
["home-section", "about-us-section", "products-services-section", "gallery-section", "feedback-section", "enquiry-section"]
  .forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) observer.observe(sec);
  });
