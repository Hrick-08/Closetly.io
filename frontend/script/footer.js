/* ============================================================
   footer.js — Shared site-footer loader
   Fetches components/footer.html and injects it into
   <div id="siteFooter">, then:
     1. Resolves data-root-path links/images relative to the
        page location (works from /index.html and /pages/*.html).
     2. Toggles account links based on auth state (auth.js).
   Requires: #siteFooter element + style.css footer styles.
   Optional: script/auth.js (for logged-in detection).
   ============================================================ */

(function () {
  const IN_PAGES_DIR = window.location.pathname.toLowerCase().includes("/pages/");

  /* Root-relative prefix so one markup works everywhere */
  function rootPath() {
    return IN_PAGES_DIR ? "../" : "";
  }

  function applyRootPaths(scope) {
    scope.querySelectorAll("[data-root-path]").forEach((el) => {
      const target = rootPath() + el.getAttribute("data-root-path");
      if (el.tagName === "A") {
        el.setAttribute("href", target);
      } else {
        el.setAttribute("src", target);
      }
      el.removeAttribute("data-root-path");
    });
  }

  function applyAuthState(scope) {
    const loggedIn = typeof Auth !== "undefined" && Auth.isLoggedIn();
    scope.querySelectorAll("[data-auth-only]").forEach((el) => {
      const mode = el.getAttribute("data-auth-only"); // "guest" | "user"
      const visible = mode === "guest" ? !loggedIn : loggedIn;
      if (visible) {
        el.hidden = false;
      } else {
        el.remove();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const mount = document.getElementById("siteFooter");
    if (!mount) return;

    fetch(rootPath() + "components/footer.html")
      .then((res) => {
        if (!res.ok) throw new Error("Footer could not be loaded");
        return res.text();
      })
      .then((html) => {
        mount.innerHTML = html;
        applyRootPaths(mount);
        applyAuthState(mount);
      })
      .catch(() => {
        /* Footer stays hidden rather than breaking the page */
      });
  });
})();
