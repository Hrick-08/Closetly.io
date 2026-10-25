document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll(".nav-item");
  const pageButtons = document.querySelectorAll("[data-page]");

  const authGate = document.getElementById("authGate");
  const profileDropdownWrap = document.querySelector(".profile-dropdown-wrap");
  const recentlyAddedStatus = document.getElementById("recentlyAddedStatus");
  const recentlyAddedGrid = document.getElementById("recentlyAddedGrid");

  /* ---------- Helpers ---------- */
  function isLoggedIn() {
    return typeof Auth !== "undefined" && Auth.isLoggedIn();
  }

  function createRecentItemCard(item) {
    const card = document.createElement("a");
    card.className = "recently-added-card";
    card.href = `pages/wardrobe.html?item=${encodeURIComponent(item._id || item.id || "")}`;
    card.setAttribute("aria-label", `Open ${item.name || "wardrobe item"} details`);

    const imageWrap = document.createElement("div");
    imageWrap.className = "recently-added-image-wrap";
    const imageSource = item.imageBase64 || item.imageUrl || item.image;
    if (typeof imageSource === "string" && imageSource) {
      const image = document.createElement("img");
      image.alt = item.name ? `${item.name} clothing item` : "Wardrobe item";
      image.loading = "lazy";
      if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(imageSource)) {
        image.src = imageSource;
      } else {
        try {
          const parsed = new URL(imageSource, window.location.href);
          if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            image.src = parsed.href;
          }
        } catch {
          image.removeAttribute("src");
        }
      }
      if (image.hasAttribute("src")) {
        imageWrap.appendChild(image);
      } else {
        imageWrap.appendChild(createImagePlaceholder());
      }
    } else {
      imageWrap.appendChild(createImagePlaceholder());
    }

    const details = document.createElement("div");
    details.className = "recently-added-details";
    const name = document.createElement("h3");
    name.textContent = item.name || "Untitled item";
    const category = document.createElement("p");
    category.textContent = item.category || "Uncategorized";
    details.append(name, category);
    card.append(imageWrap, details);
    return card;
  }

  function createImagePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "recently-added-image-placeholder";
    placeholder.setAttribute("aria-label", "No image available");
    const icon = document.createElement("i");
    icon.className = "bi bi-image";
    icon.setAttribute("aria-hidden", "true");
    placeholder.appendChild(icon);
    return placeholder;
  }

  function createAddItemCard() {
    const link = document.createElement("a");
    link.className = "recently-added-card recently-added-add-card";
    link.href = "pages/wardrobe.html?add=true";
    link.setAttribute("aria-label", "Add a new wardrobe item");

    const imageWrap = document.createElement("div");
    imageWrap.className = "recently-added-image-wrap recently-added-add-image";
    const icon = document.createElement("i");
    icon.className = "bi bi-plus-lg";
    icon.setAttribute("aria-hidden", "true");
    imageWrap.appendChild(icon);

    const details = document.createElement("div");
    details.className = "recently-added-details";
    const name = document.createElement("h3");
    name.textContent = "Add New Item";
    const category = document.createElement("p");
    category.textContent = "Add a piece to your closet";
    details.append(name, category);
    link.append(imageWrap, details);
    return link;
  }

  let recentlyAddedRequest = null;

  function showRecentlyAddedMessage(message, { showSignIn = false, showRetry = false } = {}) {
    recentlyAddedStatus.replaceChildren();
    const text = document.createElement("span");
    text.textContent = message;
    recentlyAddedStatus.appendChild(text);

    if (showSignIn) {
      const signIn = document.createElement("a");
      signIn.href = "pages/login.html";
      signIn.textContent = "Sign in";
      recentlyAddedStatus.append(" ", signIn, " to view your wardrobe.");
    }
    if (showRetry) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "recently-added-retry";
      retry.textContent = "Try again";
      retry.addEventListener("click", loadRecentlyAdded);
      recentlyAddedStatus.append(" ", retry);
    }
    recentlyAddedStatus.hidden = false;
    recentlyAddedGrid.hidden = true;
  }

  function loadRecentlyAdded() {
    if (recentlyAddedRequest) return recentlyAddedRequest;
    if (!recentlyAddedGrid || !recentlyAddedStatus) return Promise.resolve();

    if (!isLoggedIn()) {
      showRecentlyAddedMessage("Sign in to see your recently added items.", { showSignIn: true });
      return Promise.resolve();
    }

    recentlyAddedStatus.textContent = "Loading your wardrobe...";
    recentlyAddedStatus.hidden = false;
    recentlyAddedGrid.hidden = true;

    recentlyAddedRequest = Api.wardrobe.getItems({
      limit: 4,
      sortBy: "createdAt",
      sortOrder: "desc",
    }).then((data) => {
      const items = Array.isArray(data?.items) ? data.items : [];
      recentlyAddedGrid.replaceChildren();
      items.slice(0, 4).forEach((item) => {
        recentlyAddedGrid.appendChild(createRecentItemCard(item));
      });
      recentlyAddedGrid.appendChild(createAddItemCard());

      if (!items.length) {
        recentlyAddedStatus.textContent = "Your wardrobe is empty. Add your first item to get started.";
        recentlyAddedStatus.hidden = false;
      } else {
        recentlyAddedStatus.hidden = true;
      }
      recentlyAddedGrid.hidden = false;
    }).catch((error) => {
      console.error("Failed to load recently added wardrobe items:", error);
      showRecentlyAddedMessage("We couldn't load your wardrobe right now.", { showRetry: true });
      recentlyAddedRequest = null;
    });

    return recentlyAddedRequest;
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
  const protectedPages = ["search", "wardrobe", "settings"];

  /* ---------- Page navigation ---------- */
  function showPage(pageId) {

    // Protect pages that require authentication
    if (protectedPages.includes(pageId) && !isLoggedIn()) {
        showAuthGate();
        return;
    }

    // Search lives on its own dedicated page
    if (pageId === "search") {
        window.location.href = "pages/search.html";
        return;
    }

    // Wardrobe lives on its own dedicated page
    if (pageId === "wardrobe") {
        window.location.href = "pages/wardrobe.html";
        return;
    }

    // The AI Stylist lives on its own dedicated page
    if (pageId === "stylist") {
        window.location.href = "pages/stylist.html";
        return;
    }

    // Settings lives on its own dedicated page
    if (pageId === "settings") {
        window.location.href = "pages/myprofile.html";
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

    // Close Bootstrap mobile navbar after navigation
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
  loadRecentlyAdded();

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

  // ---------- Set avatar ----------
  const navAvatar = document.getElementById("navAvatar");

  if (isLoggedIn() && navAvatar) {
      const profile = Auth.getProfile();

      if (profile && profile.profilePhoto) {
          navAvatar.innerHTML = `
              <img
                  src="${profile.profilePhoto}"
                  alt="Profile"
                  class="nav-avatar-img"
              />
          `;
      } else {
          navAvatar.textContent = Auth.getInitial();
      }
  }

  /* ---------- Logout / Login ---------- */
  const ddLogout = document.getElementById("ddLogout");
  if (ddLogout) {
    // Reflect the correct label + icon based on auth state
    if (isLoggedIn()) {
      ddLogout.innerHTML = `<i class="bi bi-box-arrow-right"></i> Logout`;
    } else {
      ddLogout.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Login`;
    }

    ddLogout.addEventListener("click", async () => {
      closeDropdown();
      if (isLoggedIn()) {
        // Only actually log out if a session exists
        if (typeof Auth !== "undefined") {
          ddLogout.disabled = true;
          try {
            await Auth.logOut();
          } finally {
            ddLogout.disabled = false;
          }
        }
      }
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