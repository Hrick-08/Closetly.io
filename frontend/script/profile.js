/* ============================================================
   profile.js — Profile setup / edit page logic
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Auth guard ---------- */
  if (typeof Auth === "undefined" || !Auth.isLoggedIn()) {
    window.location.href = "l ogin.html";
    return;
  }

  /* ---------- Determine mode (setup vs edit) ---------- */
  const params = new URLSearchParams(window.location.search);
  const isEdit = params.get("mode") === "edit";
  const returnTo = params.get("return");
  const existingProfile = Auth.getProfile();
  const skipBtn = document.getElementById("skipBtn");

  if (skipBtn && !isEdit) {
    skipBtn.style.display = "inline-block";
  }

  if (isEdit) {
    const heroH1 = document.querySelector(".profile-hero h1");
    if (heroH1) heroH1.innerHTML = "Edit Your <span>Profile</span>";
    const heroP = document.querySelector(".profile-hero p");
    if (heroP) heroP.textContent = "Update your preferences to get better style recommendations.";
  }

  /* ---------- DOM refs ---------- */
  const sections = document.querySelectorAll(".profile-section");
  const steps = document.querySelectorAll(".progress-step");
  let currentStep = 0;

  /* ---------- Step navigation ---------- */
  function goToStep(idx) {
    if (idx < 0 || idx >= sections.length) return;
    currentStep = idx;
    sections.forEach((s, i) => s.classList.toggle("active", i === idx));
    steps.forEach((s, i) => {
      s.classList.remove("active", "done");
      if (i < idx) s.classList.add("done");
      if (i === idx) s.classList.add("active");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.next, 10)));
  });
  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.prev, 10)));
  });

  /* ================================================================
     PHOTO — Upload + reposition modal
     ================================================================ */
  const photoInput       = document.getElementById("photoInput");
  const photoImg         = document.getElementById("photoImg");
  const photoPlaceholder = document.getElementById("photoPlaceholder");
  const photoRemoveBtn   = document.getElementById("photoRemoveBtn");
  const photoPreview     = document.getElementById("photoPreview");
  const photoRepositionBtn = document.getElementById("photoRepositionBtn");

  /* Modal elements */
  const overlay       = document.getElementById("repositionOverlay");
  const modalImg      = document.getElementById("repositionImg");
  const previewCircle = document.getElementById("repositionPreview");
  const saveBtn       = document.getElementById("repositionSave");
  const cancelBtn     = document.getElementById("repositionCancel");

  let photoOffsetX = 0;
  let photoOffsetY = 0;
  const DRAG_RANGE = 80;

  /* Apply transform to the small preview */
  function applyPreviewTransform() {
    photoImg.style.transform = `translate(${photoOffsetX}px, ${photoOffsetY}px) scale(1.45)`;
  }

  /* Apply transform to the modal image */
  function applyModalTransform(x, y) {
    modalImg.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.45)`;
  }

  /* Show / hide photo controls */
  function showPhotoControls() {
    photoPreview.classList.add("has-photo");
    if (photoRepositionBtn) photoRepositionBtn.style.display = "";
  }

  function hidePhotoControls() {
    photoPreview.classList.remove("has-photo");
    if (photoRepositionBtn) photoRepositionBtn.style.display = "none";
  }

  function clampOffset(val) {
    return Math.max(-DRAG_RANGE, Math.min(DRAG_RANGE, val));
  }

  /* ---- Modal open / close ---- */
  function openRepositionModal() {
    if (!photoImg.src || photoImg.style.display === "none") return;
    modalImg.src = photoImg.src;
    applyModalTransform(photoOffsetX, photoOffsetY);
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeRepositionModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---- Modal drag logic ---- */
  let modalDragging = false;
  let modalStartX = 0;
  let modalStartY = 0;
  let modalStartOffsetX = 0;
  let modalStartOffsetY = 0;

  previewCircle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    modalDragging = true;
    modalStartX = e.clientX;
    modalStartY = e.clientY;
    modalStartOffsetX = photoOffsetX;
    modalStartOffsetY = photoOffsetY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!modalDragging) return;
    const dx = e.clientX - modalStartX;
    const dy = e.clientY - modalStartY;
    const nx = clampOffset(modalStartOffsetX + dx);
    const ny = clampOffset(modalStartOffsetY + dy);
    applyModalTransform(nx, ny);
  });

  document.addEventListener("mouseup", () => {
    if (!modalDragging) return;
    modalDragging = false;
    /* Read the current modal position back */
    const transform = modalImg.style.transform;
    const match = transform.match(/calc\(-50%\s*\+\s*([\d.-]+)px\).*calc\(-50%\s*\+\s*([\d.-]+)px\)/);
    if (match) {
      photoOffsetX = parseFloat(match[1]);
      photoOffsetY = parseFloat(match[2]);
    }
  });

  /* Touch support for modal */
  previewCircle.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    modalDragging = true;
    modalStartX = touch.clientX;
    modalStartY = touch.clientY;
    modalStartOffsetX = photoOffsetX;
    modalStartOffsetY = photoOffsetY;
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    if (!modalDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - modalStartX;
    const dy = touch.clientY - modalStartY;
    const nx = clampOffset(modalStartOffsetX + dx);
    const ny = clampOffset(modalStartOffsetY + dy);
    applyModalTransform(nx, ny);
  }, { passive: true });

  document.addEventListener("touchend", () => {
    if (!modalDragging) return;
    modalDragging = false;
    const transform = modalImg.style.transform;
    const match = transform.match(/calc\(-50%\s*\+\s*([\d.-]+)px\).*calc\(-50%\s*\+\s*([\d.-]+)px\)/);
    if (match) {
      photoOffsetX = parseFloat(match[1]);
      photoOffsetY = parseFloat(match[2]);
    }
  });

  /* Save position */
  saveBtn.addEventListener("click", () => {
    applyPreviewTransform();
    closeRepositionModal();
  });

  /* Cancel — revert to pre-modal offsets */
  cancelBtn.addEventListener("click", () => {
    closeRepositionModal();
  });

  /* Close on overlay click */
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeRepositionModal();
  });

  /* Close on Escape */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeRepositionModal();
    }
  });

  /* Open modal via reposition button */
  if (photoRepositionBtn) {
    photoRepositionBtn.addEventListener("click", openRepositionModal);
  }

  /* ---- Upload handler ---- */
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoImg.src = ev.target.result;
        photoImg.style.display = "block";
        photoPlaceholder.style.display = "none";
        photoRemoveBtn.style.display = "inline-block";
        photoOffsetX = 0;
        photoOffsetY = 0;
        applyPreviewTransform();
        showPhotoControls();
        /* Auto-open modal after upload */
        openRepositionModal();
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---- Remove handler ---- */
  if (photoRemoveBtn) {
    photoRemoveBtn.addEventListener("click", () => {
      photoImg.src = "";
      photoImg.style.display = "none";
      photoPlaceholder.style.display = "";
      photoRemoveBtn.style.display = "none";
      photoInput.value = "";
      photoOffsetX = 0;
      photoOffsetY = 0;
      hidePhotoControls();
    });
  }

  /* ---------- Single-select chips (fit preference) ---------- */
  document.querySelectorAll("#fitChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.closest(".chip-grid").querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });

  /* ---------- Multi-select chips ---------- */
  ["styleChips", "categoryChips", "occasionChips"].forEach(id => {
    document.querySelectorAll(`#${id} .chip`).forEach(chip => {
      chip.addEventListener("click", () => chip.classList.toggle("selected"));
    });
  });

  /* ---------- Color chips ---------- */
  const colorData = [
    { name: "Black",   hex: "#1a1a1a" },
    { name: "White",   hex: "#f5f5f5", border: true },
    { name: "Beige",   hex: "#d6c8a8" },
    { name: "Brown",   hex: "#8b5e3c" },
    { name: "Blue",    hex: "#4a7fb5" },
    { name: "Green",   hex: "#5a8a5a" },
    { name: "Red",     hex: "#c0392b" },
    { name: "Pink",    hex: "#e091a3" },
    { name: "Purple",  hex: "#7d5ba6" },
    { name: "Grey",    hex: "#8c8c8c" },
    { name: "Yellow",  hex: "#d4b94e" }
  ];

  const colorGrid = document.getElementById("colorGrid");
  if (colorGrid) {
    colorData.forEach(c => {
      const el = document.createElement("div");
      el.className = "color-chip";
      el.dataset.value = c.name.toLowerCase();
      el.innerHTML = `
        <div class="color-circle" style="background:${c.hex};${c.border ? "border:1px solid #ddd;" : ""}"></div>
        <span class="color-chip-label">${c.name}</span>
      `;
      el.addEventListener("click", () => el.classList.toggle("selected"));
      colorGrid.appendChild(el);
    });
  }

  /* ================================================================
     LOCATION — Cascading Country → State → City dropdowns
     City has "Other..." fallback for free-text entry
     ================================================================ */
  const pCountry    = document.getElementById("pCountry");
  const pState      = document.getElementById("pState");
  const pCity       = document.getElementById("pCity");
  const pCityCustom = document.getElementById("pCityCustom");
  const OTHER_VAL   = "__OTHER__";

  function populateCountries() {
    if (!pCountry || typeof LOCATIONS === "undefined") return;
    const countries = Object.keys(LOCATIONS).sort();
    countries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      pCountry.appendChild(opt);
    });
  }

  function populateStates(country) {
    if (!pState || typeof LOCATIONS === "undefined") return;
    pState.innerHTML = '<option value="">Select State</option>';
    pCity.innerHTML = '<option value="">Select City</option>';
    pCity.disabled = true;
    if (pCityCustom) { pCityCustom.style.display = "none"; pCityCustom.value = ""; }

    if (!country || !LOCATIONS[country]) {
      pState.disabled = true;
      return;
    }

    pState.disabled = false;
    const states = Object.keys(LOCATIONS[country]).sort();
    states.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      pState.appendChild(opt);
    });
  }

  function populateCities(country, state) {
    if (!pCity || typeof LOCATIONS === "undefined") return;
    pCity.innerHTML = '<option value="">Select City</option>';
    if (pCityCustom) { pCityCustom.style.display = "none"; pCityCustom.value = ""; }

    if (!country || !state || !LOCATIONS[country] || !LOCATIONS[country][state]) {
      pCity.disabled = true;
      return;
    }

    pCity.disabled = false;
    const cities = LOCATIONS[country][state].sort();
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      pCity.appendChild(opt);
    });

    const otherOpt = document.createElement("option");
    otherOpt.value = OTHER_VAL;
    otherOpt.textContent = "Other (type below)";
    pCity.appendChild(otherOpt);
  }

  if (pCountry) {
    pCountry.addEventListener("change", () => populateStates(pCountry.value));
  }
  if (pState) {
    pState.addEventListener("change", () => populateCities(pCountry.value, pState.value));
  }
  if (pCity) {
    pCity.addEventListener("change", () => {
      if (pCity.value === OTHER_VAL) {
        pCityCustom.style.display = "";
        pCityCustom.focus();
      } else {
        pCityCustom.style.display = "none";
        pCityCustom.value = "";
      }
    });
  }

  populateCountries();

  /* ---------- Load existing profile data ---------- */
  function loadProfile(p) {
    if (!p || !p.name) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

    setVal("pName", p.name);
    setVal("pEmail", p.email);
    setVal("pDob", p.dateOfBirth);
    setVal("pGender", p.gender);
    setVal("pAddress", p.address);
    setVal("pHeight", p.height);
    setVal("pWeight", p.weight);
    setVal("pSize", p.clothingSize);
    setVal("pShoe", p.shoeSize);

    if (p.country) {
      pCountry.value = p.country;
      populateStates(p.country);
      if (p.state) {
        pState.value = p.state;
        populateCities(p.country, p.state);
        if (p.city) {
          const cityExists = Array.from(pCity.options).some(o => o.value === p.city);
          if (cityExists) {
            pCity.value = p.city;
          } else {
            pCity.value = OTHER_VAL;
            pCityCustom.style.display = "";
            pCityCustom.value = p.city;
          }
        }
      }
    }

    if (p.profilePhoto && photoImg) {
      photoImg.src = p.profilePhoto;
      photoImg.style.display = "block";
      if (photoPlaceholder) photoPlaceholder.style.display = "none";
      if (photoRemoveBtn) photoRemoveBtn.style.display = "inline-block";
      if (p.photoOffsetX) photoOffsetX = p.photoOffsetX;
      if (p.photoOffsetY) photoOffsetY = p.photoOffsetY;
      applyPreviewTransform();
      showPhotoControls();
    }

    if (p.fitPreference) {
      const target = document.querySelector(`#fitChips .chip[data-value="${p.fitPreference}"]`);
      if (target) target.classList.add("selected");
    }

    function selectMulti(gridId, values) {
      if (!values || !Array.isArray(values)) return;
      values.forEach(v => {
        const chip = document.querySelector(`#${gridId} .chip[data-value="${v}"]`);
        if (chip) chip.classList.add("selected");
      });
    }

    selectMulti("styleChips", p.preferredStyles);
    selectMulti("categoryChips", p.preferredCategories);
    selectMulti("occasionChips", p.preferredOccasions);

    if (p.favoriteColors && Array.isArray(p.favoriteColors) && colorGrid) {
      p.favoriteColors.forEach(c => {
        const el = colorGrid.querySelector(`.color-chip[data-value="${c}"]`);
        if (el) el.classList.add("selected");
      });
    }
  }

  const account = Auth.getAccount();
  if (account && account.email) {
    const emailEl = document.getElementById("pEmail");
    if (emailEl) emailEl.value = account.email;
  }
  if (account && account.name && !existingProfile.name) {
    const nameEl = document.getElementById("pName");
    if (nameEl) nameEl.value = account.name;
  }

  loadProfile(existingProfile);

  /* ---------- Collect data ---------- */
  function collectData() {
    const getChips = (gridId) => {
      return Array.from(document.querySelectorAll(`#${gridId} .chip.selected`)).map(c => c.dataset.value);
    };

    let cityVal = pCity ? pCity.value : "";
    if (cityVal === OTHER_VAL) {
      cityVal = pCityCustom ? pCityCustom.value.trim() : "";
    }

    return {
      name: document.getElementById("pName").value.trim(),
      email: document.getElementById("pEmail").value.trim(),
      dateOfBirth: document.getElementById("pDob").value,
      gender: document.getElementById("pGender").value,
      country: pCountry ? pCountry.value : "",
      state: pState ? pState.value : "",
      city: cityVal,
      address: document.getElementById("pAddress").value.trim(),
      height: document.getElementById("pHeight").value.trim(),
      weight: document.getElementById("pWeight").value.trim(),
      clothingSize: document.getElementById("pSize").value,
      shoeSize: document.getElementById("pShoe").value.trim(),
      fitPreference: (document.querySelector("#fitChips .chip.selected") || {}).dataset?.value || "",
      preferredStyles: getChips("styleChips"),
      favoriteColors: colorGrid ? Array.from(colorGrid.querySelectorAll(".color-chip.selected")).map(c => c.dataset.value) : [],
      preferredCategories: getChips("categoryChips"),
      preferredOccasions: getChips("occasionChips"),
      profilePhoto: photoImg && photoImg.src && !photoImg.src.endsWith("/") ? photoImg.src : "",
      photoOffsetX: photoOffsetX,
      photoOffsetY: photoOffsetY
    };
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  /* ---------- Save ---------- */
  const mainSaveBtn = document.getElementById("saveProfileBtn");
  if (mainSaveBtn) {
    mainSaveBtn.addEventListener("click", () => {
      const data = collectData();
      if (!data.name) {
        goToStep(0);
        return;
      }
      Auth.saveProfile(data);
      if (returnTo) {
        showToast("Profile updated successfully!");
        setTimeout(() => { window.location.href = returnTo; }, 1200);
      } else {
        showToast("Profile saved! Redirecting...");
        setTimeout(() => { window.location.href = "../index.html"; }, 1200);
      }
    });
  }

  /* ---------- Skip button ---------- */
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
});
