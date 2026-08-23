/* ============================================================
   wardrobe.js — Wardrobe page

   Flow:
     pick image → POST {ML_SERVICE_URL}/classify  (existing API)
                → { category, confidence, reasoning }
                → confirm details (category prefilled,
                  subcategory picked by user) → save to localStorage

   Storage: closetlyWardrobe_<email>   (per logged-in user)
   Each item: { id, image, name, category, subcategory, createdAt }
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* Only run on the Wardrobe page */
  if (!document.getElementById("addItemBtn")) return;

  /* ---------- Auth guard (wardrobe belongs to a user) ---------- */
  if (typeof Auth === "undefined" || !Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  /* ---------- Config ---------- */
  const ML_SERVICE_URL = "http://localhost:8000";
  const MAX_FILE_MB = 8;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const STORE_PREFIX = "closetlyWardrobe_";

  /* ---------- Centralized taxonomy (8 categories) ---------- */
  const TAXONOMY = {
    "Tops": ["T-Shirts", "Shirts", "Blouses", "Sweaters", "Hoodies"],
    "Bottoms": ["Jeans", "Trousers", "Shorts", "Skirts"],
    "Outerwear": ["Jackets", "Coats", "Blazers"],
    "Dresses/Jumpsuits": ["Dresses", "Jumpsuits", "Other One-Piece Items"],
    "Footwear": ["Sneakers", "Boots", "Sandals", "Formal Shoes"],
    "Accessories": ["Bags", "Belts", "Hats", "Scarves", "Jewelry"],
    "Ethnic/Traditional Wear": [
      "Kurtas", "Kurta Sets", "Sarees", "Lehengas", "Sherwanis",
      "Salwar Suits", "Dupattas", "Traditional Footwear", "Other Traditional Wear"
    ],
    "Activewear": [
      "Gym T-Shirts", "Track Pants", "Leggings", "Sports Shorts",
      "Sports Jackets", "Other Athletic Wear"
    ]
  };

  /* ---------- User-specific storage ---------- */
  function storageKey() {
    const account = Auth.getAccount() || {};
    const profile = Auth.getProfile() || {};
    const email = account.email || profile.email || "guest";
    return STORE_PREFIX + email.toLowerCase();
  }

  function loadItems() {
    try { return JSON.parse(localStorage.getItem(storageKey())) || []; }
    catch { return []; }
  }

  function saveItems(items) {
    localStorage.setItem(storageKey(), JSON.stringify(items));
  }

  /* ---------- DOM refs ---------- */
  const els = {
    addItemBtn: document.getElementById("addItemBtn"),
    search:     document.getElementById("wbSearch"),
    filter:     document.getElementById("wbFilterCategory"),
    alert:      document.getElementById("wbAlert"),
    sections:   document.getElementById("wbSections"),

    overlay:     document.getElementById("wbOverlay"),
    step1:       document.getElementById("wbStep1"),
    step2:       document.getElementById("wbStep2"),
    closeBtn:    document.getElementById("wbCloseBtn"),
    closeBtn2:   document.getElementById("wbCloseBtn2"),
    dropzone:    document.getElementById("wbDropzone"),
    fileInput:   document.getElementById("wbFileInput"),
    preview:     document.getElementById("wbPreview"),
    previewImg:  document.getElementById("wbPreviewImg"),
    fileName:    document.getElementById("wbFileName"),
    fileSize:    document.getElementById("wbFileSize"),
    modalError:  document.getElementById("wbError"),
    changeBtn:   document.getElementById("wbChangeBtn"),
    removeBtn:   document.getElementById("wbRemoveBtn"),
    analyzeBtn:  document.getElementById("wbAnalyzeBtn"),

    thumbImg:       document.getElementById("wbThumbImg"),
    classifyNote:   document.getElementById("wbClassifyNote"),
    itemName:       document.getElementById("wbItemName"),
    categorySelect: document.getElementById("wbCategory"),
    subcatSelect:   document.getElementById("wbSubcategory"),
    backBtn:        document.getElementById("wbBackBtn"),
    saveBtn:        document.getElementById("wbSaveBtn"),

    loading:     document.getElementById("wbLoading"),
    loadingText: document.getElementById("wbLoadingText")
  };

  let selectedFile = null;   // File being added
  let editingId = null;      // item id when in Edit mode
  let items = loadItems();

  /* ============================================================
     Rendering
     ============================================================ */
  function render() {
    const query = els.search.value.trim().toLowerCase();
    const filterCat = els.filter.value;

    els.sections.innerHTML = "";
    let totalVisible = 0;

    Object.keys(TAXONOMY).forEach((group) => {
      if (filterCat && group !== filterCat) return;

      const groupItems = items.filter((it) => it.category === group);
      const visible = groupItems.filter((it) =>
        !query ||
        (it.name || "").toLowerCase().includes(query) ||
        (it.subcategory || "").toLowerCase().includes(query)
      );

      const section = document.createElement("section");
      section.className = "wb-category";

      const head = document.createElement("div");
      head.className = "wb-category-head";
      const title = document.createElement("h2");
      title.innerHTML = `${group} <span class="wb-count">${visible.length}</span>`;
      head.appendChild(title);
      section.appendChild(head);

      if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "wb-empty-category";

        if (!query && groupItems.length === 0) {
          /* Genuinely empty category */
          const icon = document.createElement("i");
          icon.className = "bi bi-inbox";
          const p1 = document.createElement("p");
          p1.textContent = "No items yet";
          const p2 = document.createElement("small");
          p2.textContent = "Add your first item to your wardrobe.";
          empty.append(icon, p1, p2);

          const addSmall = document.createElement("button");
          addSmall.type = "button";
          addSmall.className = "wb-add-small";
          addSmall.innerHTML = `<i class="bi bi-plus-lg"></i> Add Item`;
          addSmall.addEventListener("click", openAddModal);
          empty.appendChild(addSmall);
        } else {
          /* Filtered out everything in this category */
          const p = document.createElement("p");
          p.textContent = "No items match your search.";
          empty.appendChild(p);
        }

        section.appendChild(empty);
        els.sections.appendChild(section);
        return;
      }

      totalVisible += visible.length;
      const grid = document.createElement("div");
      grid.className = "row g-3 wb-grid";

      visible.forEach((item) => grid.appendChild(itemCard(item)));
      section.appendChild(grid);
      els.sections.appendChild(section);
    });

    if (!totalVisible) {
      const none = document.createElement("div");
      none.className = "search-empty";
      const h = document.createElement("h2");
      h.textContent = query || filterCat ? "No matching clothes" : "Your wardrobe is empty";
      const p = document.createElement("p");
      p.textContent = query || filterCat
        ? "Nothing matches your search or filter. Try something else."
        : 'Click "+ Add Item" to add your first clothing item.';
      none.append(h, p);
      els.sections.appendChild(none);
    }
  }

  function itemCard(item) {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3 wb-item-col";

    const card = document.createElement("article");
    card.className = "wb-card";

    const imgWrap = document.createElement("div");
    imgWrap.className = "wb-card-image";
    const img = document.createElement("img");
    img.alt = item.name;
    img.loading = "lazy";
    img.src = item.image || placeholderSvg();
    imgWrap.appendChild(img);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "wb-icon-btn wb-delete-btn";
    del.title = "Delete item";
    del.setAttribute("aria-label", "Delete item");
    del.innerHTML = `<i class="bi bi-trash"></i>`;
    del.addEventListener("click", () => deleteItem(item.id));
    imgWrap.appendChild(del);

    const body = document.createElement("div");
    body.className = "wb-card-body";

    const name = document.createElement("h3");
    name.textContent = item.name || "Untitled item";
    name.title = item.name;
    body.appendChild(name);

    const catLine = document.createElement("span");
    catLine.className = "wb-card-cat";
    catLine.textContent = item.subcategory
      ? `${item.category} · ${item.subcategory}`
      : item.category;
    body.appendChild(catLine);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "wb-edit-btn";
    edit.innerHTML = `<i class="bi bi-pencil"></i> Edit Category`;
    edit.addEventListener("click", () => openEditModal(item.id));
    body.appendChild(edit);

    card.append(imgWrap, body);
    col.appendChild(card);
    return col;
  }

  function placeholderSvg() {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#f0ece5"/><text x="50%" y="50%" font-family="sans-serif" font-size="15" fill="#9a6037" text-anchor="middle">No image</text></svg>`
    );
  }

  /* ---------- Toolbar events ---------- */
  els.search.addEventListener("input", render);
  els.filter.addEventListener("change", render);

  function showAlert(message, type = "error") {
    els.alert.textContent = message;
    els.alert.className = `wb-alert ${type}`;
    els.alert.hidden = false;
    setTimeout(() => { els.alert.hidden = true; }, 5000);
  }

  /* ============================================================
     Add-item modal — step 1: choose & validate image
     ============================================================ */
  function openAddModal() {
    editingId = null;
    showStep(1);
    clearFile();
    clearModalError();
    els.overlay.style.display = "grid";
    document.body.style.overflow = "hidden";
  }

  function openEditModal(itemId) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    editingId = itemId;
    clearFile();
    clearModalError();
    els.thumbImg.src = item.image || placeholderSvg();

    els.itemName.value = item.name || "";
    fillCategorySelect(item.category);
    fillSubcategorySelect(item.category, item.subcategory);
    els.classifyNote.hidden = true;

    els.backBtn.style.display = "none"; // nothing to go back to in edit mode
    els.saveBtn.innerHTML = `<i class="bi bi-check-lg"></i> Save Changes`;

    showStep(2);
    els.overlay.style.display = "grid";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (els.loading.style.display === "grid") return; // don't close mid-analyze
    els.overlay.style.display = "none";
    document.body.style.overflow = "";
    clearFile();
    editingId = null;
  }

  function showStep(n) {
    els.step1.style.display = n === 1 ? "" : "none";
    els.step2.style.display = n === 2 ? "" : "none";
    if (n === 1) els.saveBtn.innerHTML = `<i class="bi bi-check-lg"></i> Add to Wardrobe`;
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
      showModalError("Please upload a valid clothing image (JPG, PNG or WEBP).");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showModalError("Image is too large. Please choose a smaller image.");
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
      els.analyzeBtn.disabled = false;
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
    els.analyzeBtn.disabled = true;
    clearModalError();
  }

  /* Modal events — step 1 */
  els.addItemBtn.addEventListener("click", openAddModal);
  els.closeBtn.addEventListener("click", closeModal);
  els.closeBtn2.addEventListener("click", closeModal);
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

  /* ============================================================
     Step 1 → Analyze → existing POST /classify endpoint
     ============================================================ */
  els.analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);   // field name required by the API

    setLoading(true, "Analyzing your item...");
    try {
      const res = await fetch(`${ML_SERVICE_URL}/classify`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).detail || ""; } catch { }
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const result = await res.json();
      prepareDetailsStep(result);

    } catch (err) {
      const msg = err && err.message ? err.message : "";
      if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
        showModalError("Couldn't analyze your item right now. Please try again.");
      } else if (msg.includes("GROQ_API_KEY")) {
        showModalError("Classifier is not configured on the server yet.");
      } else {
        showModalError("Couldn't analyze your item right now. Please try again.");
      }
      showModalTop(); // keep step 1 visible so the error shows in the modal
    } finally {
      setLoading(false);
    }
  });

  /* Bring the error into view even though page didn't scroll */
  function showModalTop() {
    const modal = document.querySelector(".wb-modal");
    if (modal) modal.scrollTop = 0;
  }

  function setLoading(on, text) {
    if (!on) {
      els.loading.style.display = "none";
      return;
    }
    els.loadingText.textContent = text;
    els.loading.style.display = "grid";
  }

  /* ============================================================
     Step 2 — confirm/edit details, then persist
     ============================================================ */
  function prepareDetailsStep(result) {
    /* Map classifier output ("Tops", "Bottoms", …) to our taxonomy.
       The existing API already validates against the same 8 groups,
       so we do a tolerant match for safety only. */
    const detected = mapCategory(result ? result.category : "");
    const confidence = result ? String(result.confidence || "").toLowerCase() : "";

    fillCategorySelect(detected);
    fillSubcategorySelect(detected, "");

    els.thumbImg.src = els.previewImg.src;

    /* Default name from filename without extension */
    const base = selectedFile ? selectedFile.name.replace(/\.[^.]+$/, "") : "";
    els.itemName.value = base.charAt(0).toUpperCase() + base.slice(1);

    if (!detected) {
      els.classifyNote.textContent =
        "We couldn't confidently identify this item. Please choose the category manually.";
      els.classifyNote.hidden = false;
    } else if (confidence === "low") {
      els.classifyNote.textContent =
        `Detected as "${detected}" with low confidence — please double-check below.`;
      els.classifyNote.hidden = false;
    } else {
      els.classifyNote.textContent =
        `Looks like ${detected}. Adjust anything that's wrong.`;
      els.classifyNote.hidden = false;
    }

    els.backBtn.style.display = "";   // allow changing the image
    showStep(2);
    showModalTop();
  }

  function mapCategory(value) {
    if (!value) return "";
    const v = value.trim().toLowerCase();
    const keys = Object.keys(TAXONOMY);
    for (const cat of keys) {
      if (v === cat.toLowerCase() || cat.toLowerCase().includes(v) || v.includes(cat.toLowerCase())) {
        return cat;
      }
    }
    return "";
  }

  function fillCategorySelect(selected) {
    els.categorySelect.innerHTML = '<option value="">Select Category</option>';
    Object.keys(TAXONOMY).forEach((cat) => {
      els.categorySelect.add(new Option(cat, cat));
    });
    els.categorySelect.value = selected || "";
  }

  function fillSubcategorySelect(category, selected) {
    els.subcatSelect.innerHTML = '<option value="">Select Subcategory</option>';
    (TAXONOMY[category] || []).forEach((sub) => {
      els.subcatSelect.add(new Option(sub, sub));
    });
    els.subcatSelect.disabled = !category;
    els.subcatSelect.value = selected && (TAXONOMY[category] || []).includes(selected)
      ? selected
      : "";
  }

  els.categorySelect.addEventListener("change", () =>
    fillSubcategorySelect(els.categorySelect.value, "")
  );

  els.backBtn.addEventListener("click", () => showStep(1));

  els.saveBtn.addEventListener("click", () => {
    const name = els.itemName.value.trim();
    const category = els.categorySelect.value;

    if (!name) { els.itemName.focus(); return; }
    if (!category) { els.categorySelect.focus(); return; }

    if (editingId) {
      /* Reclassify / rename existing item */
      const item = items.find((i) => i.id === editingId);
      if (item) {
        item.name = name;
        item.category = category;
        item.subcategory = els.subcatSelect.value;
        saveItems(items);
      }
    } else {
      const item = {
        id: generateId(),
        image: downscaleImage(),
        name: name,
        category: category,
        subcategory: els.subcatSelect.value,
        createdAt: new Date().toISOString()
      };
      items.push(item);
      try {
        saveItems(items);
      } catch (e) {
        showAlert("Storage is full — could not save this item.", "error");
        items.pop();
        return;
      }
    }

    closeModal();
    render();
  });

  function generateId() {
    return (crypto.randomUUID)
      ? crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /* Shrink stored images so localStorage doesn't overflow.
     Reads dimensions from the already-loaded preview <img>. */
  function downscaleImage() {
    const MAX_DIM = 800;
    const el = els.previewImg;
    if (!el.naturalWidth || el.naturalWidth <= MAX_DIM) return el.src;

    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(MAX_DIM / el.naturalWidth, MAX_DIM / el.naturalHeight, 1);
      canvas.width = Math.round(el.naturalWidth * scale);
      canvas.height = Math.round(el.naturalHeight * scale);
      canvas.getContext("2d").drawImage(el, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      return el.src;
    }
  }

  /* ============================================================
     Delete
     ============================================================ */
  function deleteItem(itemId) {
    if (!confirm("Remove this item from your wardrobe?")) return;
    items = items.filter((i) => i.id !== itemId);
    saveItems(items);
    render();
  }

  /* ============================================================
     Init
     ============================================================ */
  els.filter.innerHTML = '<option value="">All Categories</option>';
  Object.keys(TAXONOMY).forEach((cat) => els.filter.add(new Option(cat, cat)));

  render();
});
