/* ============================================================
   search.js — Search page (image search only)

   Uses the existing endpoint:
     POST {ML_SERVICE_URL}/search   (multipart/form-data)
       - image (file) → server describes it with the LLM,
                        then searches Google Shopping
   Response: { query, results: [...], total }

   API keys stay in the microservice .env — never in this file.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* Only run on the Search page */
  if (!document.getElementById("openVisualSearchBtn")) return;

  /* ---------- Auth guard (search belongs to a logged-in user) ---------- */
  if (typeof Auth === "undefined" || !Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  /* ---------- Config ---------- */
  const ML_SERVICE_URL = "http://localhost:8000";
  const MAX_FILE_MB = 8;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  /* ---------- DOM refs ---------- */
  const els = {
    openVisualBtn: document.getElementById("openVisualSearchBtn"),
    mlStatusDot:   document.getElementById("mlStatusDot"),
    mlStatusText:  document.getElementById("mlStatusText"),

    alert:         document.getElementById("searchAlert"),
    meta:          document.getElementById("resultsMeta"),
    grid:          document.getElementById("resultsGrid"),
    empty:         document.getElementById("searchEmpty"),

    overlay:       document.getElementById("vsOverlay"),
    closeBtn:      document.getElementById("vsCloseBtn"),
    dropzone:      document.getElementById("vsDropzone"),
    fileInput:     document.getElementById("vsFileInput"),
    preview:       document.getElementById("vsPreview"),
    previewImg:    document.getElementById("vsPreviewImg"),
    fileName:      document.getElementById("vsFileName"),
    fileSize:      document.getElementById("vsFileSize"),
    modalError:    document.getElementById("vsError"),
    changeBtn:     document.getElementById("vsChangeBtn"),
    removeBtn:     document.getElementById("vsRemoveBtn"),
    vsSearchBtn:   document.getElementById("vsSearchBtn"),

    loading:       document.getElementById("vsLoading"),
    loadingText:   document.getElementById("vsLoadingText")
  };

  let selectedFile = null;

  /* ============================================================
     Service health check (so we can show why visual search is off)
     ============================================================ */
  async function checkService() {
    try {
      const res = await fetch(`${ML_SERVICE_URL}/health`);
      if (!res.ok) throw new Error();
      setServiceStatus("online", "AI service connected");
      els.openVisualBtn.disabled = false;
    } catch {
      setServiceStatus("offline", "AI service offline — start it with: uvicorn app.main:app --reload");
      els.openVisualBtn.disabled = true;
    }
  }

  function setServiceStatus(state, text) {
    els.mlStatusDot.className = `status-dot status-${state}`;
    els.mlStatusText.textContent = text;
  }

  /* ============================================================
     The one API call — existing POST /search endpoint
     ============================================================ */
  async function callSearch(formData) {
    const res = await fetch(`${ML_SERVICE_URL}/search`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).detail || ""; } catch { }
      throw new Error(detail || `Request failed (${res.status})`);
    }
    return res.json();
  }

  /* ============================================================
     Rendering — response shape: {query, results:[{title, link,
     thumbnail, price, old_price, source, rating, reviews}], total}
     ============================================================ */
  function displayProducts(data) {
    els.grid.innerHTML = "";

    if (!data.results || !data.results.length) {
      showEmpty(
        "No products found",
        "No similar products were found. Try different keywords or another image."
      );
      els.meta.hidden = true;
      return;
    }

    hideEmpty();
    els.meta.textContent =
      `Showing ${data.total} product${data.total === 1 ? "" : "s"} for "${data.query}"`;
    els.meta.hidden = false;

    data.results.forEach((p) => els.grid.appendChild(productCard(p)));
  }

  function productCard(p) {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";

    const card = document.createElement("article");
    card.className = "product-card";

    /* Image */
    const imgWrap = document.createElement("div");
    imgWrap.className = "product-image";
    const img = document.createElement("img");
    img.alt = p.title || "Product";
    img.loading = "lazy";
    img.src = p.thumbnail || placeholderSvg();
    img.addEventListener("error", () => { img.style.opacity = "0.25"; });
    imgWrap.appendChild(img);

    /* Body */
    const body = document.createElement("div");
    body.className = "product-body";

    if (p.source) {
      const source = document.createElement("span");
      source.className = "product-source";
      source.textContent = p.source;
      body.appendChild(source);
    }

    const title = document.createElement("h3");
    title.className = "product-title";
    title.textContent = p.title || "Untitled product";
    body.appendChild(title);

    if (p.price) {
      const priceRow = document.createElement("div");
      priceRow.className = "product-price-row";
      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = `₹${p.price}`;
      priceRow.appendChild(price);
      if (p.old_price) {
        const old = document.createElement("span");
        old.className = "product-old-price";
        old.textContent = `₹${p.old_price}`;
        priceRow.appendChild(old);
      }
      body.appendChild(priceRow);
    }

    if (p.rating != null) {
      const rating = document.createElement("span");
      rating.className = "product-rating";
      rating.textContent = `★ ${p.rating}${p.reviews ? ` (${p.reviews})` : ""}`;
      body.appendChild(rating);
    }

    if (p.link) {
      const cta = document.createElement("a");
      cta.className = "btn-primary-custom product-cta";
      cta.href = p.link;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.innerHTML = `<i class="bi bi-box-arrow-up-right"></i> View Product`;
      body.appendChild(cta);
    }

    card.appendChild(imgWrap);
    card.appendChild(body);
    col.appendChild(card);
    return col;
  }

  function placeholderSvg() {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#f0ece5"/><text x="50%" y="50%" font-family="sans-serif" font-size="15" fill="#9a6037" text-anchor="middle">No image</text></svg>`
    );
  }

  function showEmpty(title, text) {
    els.empty.querySelector("h2").textContent = title;
    els.empty.querySelector("p").textContent = text;
    els.empty.hidden = false;
    els.empty.style.display = "";
  }

  function hideEmpty() {
    els.empty.hidden = true;
    els.empty.style.display = "none";
  }

  function showAlert(message, type = "error") {
    els.alert.textContent = message;
    els.alert.className = `search-alert ${type}`;
    els.alert.hidden = false;
  }

  /* ============================================================
     Loading state
     ============================================================ */
  function setLoading(on, text) {
    clearInterval(window.__searchLoadTimer);
    if (!on) {
      els.loading.style.display = "none";
      return;
    }
    els.loadingText.textContent = text;
    els.loading.style.display = "grid";
  }

  /* ============================================================
     Image search — same /search endpoint, just send the image
     ============================================================ */
  els.vsSearchBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("num_results", "8");

    /* Close the modal first so results are visible while loading */
    els.overlay.style.display = "none";
    document.body.style.overflow = "";

    setLoading(true, "Analyzing your image...");
    try {
      displayProducts(await callSearch(formData));
    } catch (err) {
      showAlert(friendlyError(err));
    } finally {
      setLoading(false);
      clearFile();
    }
  });

  function friendlyError(err) {
    const msg = err && err.message ? err.message : "";
    if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
      return "Can't reach the Closetly AI service. Make sure the microservice is running on port 8000.";
    }
    if (msg.includes("GROQ_API_KEY")) return "Image search is not configured on the server yet.";
    if (msg.includes("SERPAPI_KEY")) return "Product search is not configured on the server yet.";
    if (msg) return msg;
    return "Something went wrong. Please try again.";
  }

  /* ============================================================
     Upload modal: file selection, preview, validation
     ============================================================ */
  function openModal() {
    els.overlay.style.display = "grid";
    document.body.style.overflow = "hidden";
    clearModalError();
  }

  function closeModal() {
    if (els.loading.style.display === "grid") return; // don't close mid-search
    els.overlay.style.display = "none";
    document.body.style.overflow = "";
    clearFile();
  }

  function clearModalError() {
    els.modalError.hidden = true;
    els.modalError.textContent = "";
  }

  function showModalError(message) {
    els.modalError.textContent = message;
    els.modalError.hidden = false;
  }

  function validateAndSetFile(file) {
    clearModalError();
    if (!file) return;

    const extOk = [".jpg", ".jpeg", ".png", ".webp"]
      .some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!ALLOWED_TYPES.includes(file.type) && !extOk) {
      showModalError("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showModalError(`That image is too large (max ${MAX_FILE_MB} MB). Please choose a smaller photo.`);
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      els.previewImg.src = ev.target.result;
      els.fileName.textContent = file.name;
      els.fileSize.textContent =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      els.dropzone.style.display = "none";
      els.preview.style.display = "flex";
      els.changeBtn.style.display = "";
      els.removeBtn.style.display = "";
      els.vsSearchBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function clearFile() {
    selectedFile = null;
    els.fileInput.value = "";
    els.previewImg.src = "";
    els.dropzone.style.display = "";
    els.preview.style.display = "none";
    els.changeBtn.style.display = "none";
    els.removeBtn.style.display = "none";
    els.vsSearchBtn.disabled = true;
    clearModalError();
  }

  /* Modal events */
  els.openVisualBtn.addEventListener("click", openModal);
  els.closeBtn.addEventListener("click", closeModal);
  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.overlay.style.display === "grid") closeModal();
  });

  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.changeBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", () => validateAndSetFile(els.fileInput.files[0]));
  els.removeBtn.addEventListener("click", clearFile);

  /* Drag & drop */
  ["dragenter", "dragover"].forEach((evt) =>
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    els.dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropzone.classList.remove("dragover");
    })
  );
  els.dropzone.addEventListener("drop", (e) => {
    validateAndSetFile(e.dataTransfer.files[0]);
  });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());

  /* ---------- Init ---------- */
  checkService();
});