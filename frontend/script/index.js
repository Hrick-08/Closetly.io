document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll(".nav-item");
  const pageButtons = document.querySelectorAll("[data-page]");

  const authGate = document.getElementById("authGate");
  const profileDropdownWrap = document.querySelector(".profile-dropdown-wrap");

  /* ---------- Helpers ---------- */
  function isLoggedIn() {
    return typeof Auth !== "undefined" && Auth.isLoggedIn();
  }

  function closeDropdown() {
    if (profileDropdownWrap) profileDropdownWrap.classList.remove("open");
  }

  /* ---------- Auth gate overlay ---------- */
  function showAuthGate() {
    if (authGate) authGate.style.display = "grid";
  }

  function hideAuthGate() {
    if (authGate) authGate.style.display = "none";
  }

  /* Pages that require authentication */
  const protectedPages = ["wardrobe", "settings"];

  /* ---------- Page navigation ---------- */
  function showPage(pageId) {
    /* Protect specific pages behind auth gate */
    if (protectedPages.includes(pageId) && !isLoggedIn()) {
      showAuthGate();
      return;
    }

    hideAuthGate();

    pages.forEach((page) => {
      page.classList.toggle("active-page", page.id === pageId);
    });

    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    /* Close Bootstrap mobile navbar after navigation */
    const navCollapse = document.getElementById("mainNav");
    if (navCollapse && navCollapse.classList.contains("show")) {
      const collapse = bootstrap.Collapse.getInstance(navCollapse);
      if (collapse) collapse.hide();
    }
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      closeDropdown();
      const target = button.dataset.page;
      if (target) showPage(target);
    });
  });

  /* Start on Home — always visible, no auth required */
  showPage("home");

  /* ---------- Profile dropdown toggle ---------- */
  const profileToggle = document.getElementById("profileToggle");

  if (profileToggle && profileDropdownWrap) {
    profileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdownWrap.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdownWrap.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  /* ---------- Set avatar initial ---------- */
  const navAvatar = document.getElementById("navAvatar");
  if (isLoggedIn() && navAvatar) {
    navAvatar.textContent = Auth.getInitial();
  }

  /* ---------- Logout ---------- */
  const ddLogout = document.getElementById("ddLogout");
  if (ddLogout) {
    ddLogout.addEventListener("click", () => {
      closeDropdown();
      if (typeof Auth !== "undefined") Auth.logOut();
      window.location.href = "pages/login.html";
    });
  }

  /* ---------- "My Profile" dropdown link ---------- */
  const ddProfile = document.getElementById("ddProfile");
  if (ddProfile) {
    ddProfile.addEventListener("click", (e) => {
      e.preventDefault();
      closeDropdown();
      if (isLoggedIn()) {
        window.location.href = "pages/myprofile.html";
      } else {
        window.location.href = "pages/login.html";
      }
    });
  }

  /* ---------- Settings "Edit Profile" button ---------- */
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      if (isLoggedIn()) {
        window.location.href = "pages/profile.html?mode=edit&return=../index.html";
      } else {
        window.location.href = "pages/login.html";
      }
    });
  }

  /* ---------- Settings dropdown "Settings" link ---------- */
  const ddSettings = document.getElementById("ddSettings");
  if (ddSettings) {
    ddSettings.addEventListener("click", (e) => {
      e.preventDefault();
      closeDropdown();
      if (!isLoggedIn()) {
        showAuthGate();
        return;
      }
      showPage("settings");
    });
  }

  /* ---------- Auth gate: close on backdrop click ---------- */
  if (authGate) {
    authGate.addEventListener("click", (e) => {
      if (e.target === authGate) {
        hideAuthGate();
      }
    });
  }
});
