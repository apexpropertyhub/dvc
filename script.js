/* ===== Apex Property Hub — Digital Visiting Card ===== */

/* Google Apps Script Web App URL (the .../exec link) — used for both
   inquiries and feedback. The script routes by the payload's "form" field. */
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwrBmv4BmDFiL8-0orQJR-9azKeXqJN-ENxWOQgGVVim6JzB3vwCFuhXp1MWL_jkb1HLA/exec";

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

/* ---------- 3. Gallery ----------
   Property photos live in the /gallery folder. To add a new one:
   1) Drop the image file (jpg/png/webp) into the gallery/ folder.
   2) Add an entry to gallery/gallery.json  ->  { "title": "...", "file": "yourphoto.jpg" }
   The grid is built automatically from that manifest. Tapping a photo opens
   a full-screen lightbox so visitors can view it large. */
const galleryGrid = document.getElementById("galleryGrid");

// --- Lightbox: built once, reused for every photo ---
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
  <span class="lightbox-close" aria-label="Close">&times;</span>
  <img class="lightbox-img" alt="" />
  <p class="lightbox-caption"></p>`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector(".lightbox-img");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");

function openLightbox(src, title) {
  lightboxImg.src = src;
  lightboxImg.alt = title || "";
  lightboxCaption.textContent = title || "";
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden"; // stop background scroll
}
function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
  lightboxImg.src = "";
}
lightbox.addEventListener("click", (e) => {
  // close when clicking the backdrop or the × (but not the image itself)
  if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
    closeLightbox();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

function renderGallery(items) {
  galleryGrid.innerHTML = "";
  if (!items.length) {
    galleryGrid.innerHTML = `<p style="font-size:14px;color:#6b7280">No photos available yet.</p>`;
    return;
  }
  items.forEach(({ title, file }) => {
    const url = "gallery/" + file;
    const img = document.createElement("img");
    img.src = url;
    img.alt = title || "Property photo";
    img.title = title || "";
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(url, title));
    galleryGrid.appendChild(img);
  });
}

fetch("gallery/gallery.json", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then(renderGallery)
  .catch(() => {
    galleryGrid.innerHTML =
      `<p style="font-size:14px;color:#6b7280">Could not load photos. ` +
      `Make sure gallery/gallery.json exists.</p>`;
  });

/* ---------- 4. Feedbacks ---------- */
// Built-in sample testimonials shown by default. Feedback submitted by
// visitors is stored in the Google Sheet and loaded on top of these.
const seedFeedbacks = [
  
];
let feedbacks = [...seedFeedbacks];

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
function showFeedbackLoader() {
  feedbackList.innerHTML = `
    <div class="feedback-loader">
      <span class="spinner"></span>
      <span>Loading feedback…</span>
    </div>`;
}

// Load feedback saved by other visitors from the sheet, newest first,
// and show it above the built-in samples.
function loadFeedbacks() {
  showFeedbackLoader();
  fetch(SHEET_API_URL + "?form=feedback", { cache: "no-store" })
    .then((r) => r.json())
    .then((rows) => {
      if (Array.isArray(rows)) feedbacks = [...rows, ...seedFeedbacks];
      renderFeedbacks();
    })
    .catch(() => {
      // Show the seed testimonials if the load fails.
      renderFeedbacks();
    });
}
loadFeedbacks();

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

  const entry = {
    name,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    rating: selectedRating,
    text,
  };

  // Save to the Google Sheet so every visitor sees it. Tag with form:"feedback"
  // so the Apps Script routes it to the Feedback tab.
  fetch(SHEET_API_URL, {
    method: "POST",
    body: JSON.stringify({ form: "feedback", ...entry }),
  }).catch(() => {
    /* even if the save fails, still show it locally below */
  });

  // Show it immediately for this visitor (it will also load for others on refresh).
  feedbacks.unshift(entry);
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
    form: "inquiry",
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

  fetch(SHEET_API_URL, {
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
