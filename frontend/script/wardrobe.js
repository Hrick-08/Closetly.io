/* ==========================================================
   wardrobe.js
   Drives the Add Clothing modal + wardrobe category grid on
   pages/wardrobe.html.

   Flow:
   1. User picks a file -> modal switches to loading state
   2. File is POSTed to POST /api/classify (backend/ML service)
   3. Response { category: "..." } is used to:
        - store the item (localStorage stand-in for now — swap
          for a real API call once a backend "save item" route
          exists)
        - show a result state (thumbnail + predicted category)
   4. Modal auto-closes, wardrobe re-renders. If the predicted
      category doesn't have a section yet, one is created on
      the fly (inserted before "Other" so Other stays last).
   ========================================================== */

const API_BASE = "http://127.0.0.1:8000";
const STORAGE_KEY = "wardrobeItems";

document.addEventListener("DOMContentLoaded", () => {
  const deviceBtn = document.getElementById("deviceBtn");
  const fileInput = document.getElementById("fileInput");
  const modalStateChoose = document.getElementById("modalStateChoose");
  const modalStateLoading = document.getElementById("modalStateLoading");
  const modalStateResult = document.getElementById("modalStateResult");
  const resultThumb = document.getElementById("resultThumb");
  const resultLabel = document.getElementById("resultLabel");
  const resultRawLabel = document.getElementById("resultRawLabel");
  const addClothingModalEl = document.getElementById("addClothingModal");

  // If this page doesn't have the modal (defensive — shouldn't happen on
  // wardrobe.html), bail out quietly instead of throwing.
  if (!deviceBtn || !fileInput) {
    renderWardrobe();
    return;
  }

  deviceBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showState("loading");

    const formData = new FormData();
    // Field name MUST be "image" — matches the real backend's
    // `async def classify(image: UploadFile = File(...))` signature.
    // FastAPI matches multipart field names exactly; "file" would 422.
    formData.append("image", file);

    let category = "Other";
    try {
      // Hard timeout so a missing/unreachable backend (or a firewall
      // silently swallowing the connection) can't leave the modal
      // stuck on "Classifying..." indefinitely — fetch() alone has
      // no built-in timeout and can hang far longer than expected.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s

      const res = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`classify failed: ${res.status}`);
      const data = await res.json();
      // Confirmed response shape from ClassifyResponse (schemas.py):
      // { category: str, confidence: str, reasoning: str }
      category = data.category || "Other";
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Classifier request timed out after 5s, defaulting to Other.");
      } else {
        console.error("Classifier unreachable or failed, defaulting to Other:", err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      saveItem(category, reader.result);
      showResult(reader.result, category);
    };
    reader.readAsDataURL(file);
  });

  function showState(state) {
    modalStateChoose.style.display = state === "choose" ? "" : "none";
    modalStateLoading.style.display = state === "loading" ? "" : "none";
    modalStateResult.style.display = state === "result" ? "" : "none";
  }

  function showResult(imageDataUrl, category) {
    resultThumb.src = imageDataUrl;
    resultLabel.textContent = category;
    resultRawLabel.textContent = `Detected: ${category}`;
    showState("result");

    // Give the user a moment to see the confirmation, then close and
    // refresh the wardrobe grid.
    setTimeout(() => {
      bootstrap.Modal.getInstance(addClothingModalEl)?.hide();
    }, 1100);
  }

  // Reset back to the "choose" state and re-render whenever the modal
  // is closed (whether by success, the X button, or clicking outside).
  addClothingModalEl?.addEventListener("hidden.bs.modal", () => {
    showState("choose");
    fileInput.value = "";
    renderWardrobe();
  });

  renderWardrobe();
});

/**
 * Persists an item. Currently backed by localStorage as a placeholder —
 * swap the body of this function for a real POST to your backend once
 * a "save wardrobe item" endpoint exists, without touching anything
 * that calls it.
 */
function saveItem(category, imageDataUrl) {
  const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  items.push({ category, image: imageDataUrl, addedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Turns a predicted category into a safe DOM id fragment. */
function slugify(category) {
  return String(category).replace(/\s+/g, "");
}

/**
 * Returns the section element for a category, creating it if the model
 * predicted a category that doesn't have a pre-built section in the HTML
 * (e.g. "Pendant" or any future class the model learns). New sections are
 * inserted right before "Other" so Other always stays last.
 */
function ensureCategorySection(category) {
  const id = `section-${slugify(category)}`;
  let section = document.getElementById(id);
  if (section) return section;

  const container = document.getElementById("wardrobeSections");
  if (!container) return null;

  section = document.createElement("div");
  section.className = "wardrobe-section";
  section.id = id;
  section.innerHTML = `
    <div class="section-title">${category}</div>
    <div class="wardrobe-grid"><span class="empty-note">No items yet.</span></div>
  `;

  const otherSection = document.getElementById("section-Other");
  if (otherSection) {
    container.insertBefore(section, otherSection);
  } else {
    container.appendChild(section);
  }
  return section;
}

/** Re-renders the hero/empty state vs. populated wardrobe sections. */
function renderWardrobe() {
  const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const heroCard = document.getElementById("heroCard");
  const wardrobeSections = document.getElementById("wardrobeSections");

  if (!heroCard || !wardrobeSections) return;

  const hasItems = items.length > 0;
  heroCard.style.display = hasItems ? "none" : "";
  wardrobeSections.style.display = hasItems ? "" : "none";
  if (!hasItems) return;

  const byCategory = {};
  items.forEach((item) => {
    (byCategory[item.category] ||= []).push(item);
  });

  Object.keys(byCategory).forEach((category) => {
    const section = ensureCategorySection(category);
    if (!section) return;
    const grid = section.querySelector(".wardrobe-grid");
    grid.innerHTML = "";
    byCategory[category].forEach((item) => {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = category;
      img.style.cssText =
        "width:120px;height:120px;object-fit:cover;border-radius:10px;border:1px solid var(--hairline);background:#fff;";
      grid.appendChild(img);
    });
  });
}