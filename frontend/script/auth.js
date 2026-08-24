/* ============================================================
   auth.js — Authentication service (localStorage-backed)
   Designed for easy swap to REST API later.

   Storage keys:
     closetlyAuth    — account registration (name, email, phone,
                       passwordHash — SHA-256 hex digest, never the
                       plaintext password)
                       Persists across logouts. Cleared only on
                       account deletion.
     closetlySession — session state (isAuthenticated)
                       Cleared on logout.
     closetlyUser    — profile data
                       Persists across logouts.
   ============================================================ */

const Auth = (() => {
  const AUTH_KEY  = "closetlyAuth";    // account registration
  const SESS_KEY  = "closetlySession"; // login session
  const USER_KEY  = "closetlyUser";    // profile data

  /* ---------- helpers ---------- */

  function _read(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }

  function _write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * SHA-256 hash of a password, hex-encoded.
   * Uses the Web Crypto API (crypto.subtle) — never store or compare
   * plaintext passwords.
   */
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  /* ---------- public API ---------- */

  function getAccount() {
    return _read(AUTH_KEY);
  }

  function getSession() {
    return _read(SESS_KEY);
  }

  function isLoggedIn() {
    const s = getSession();
    return !!(s && s.isAuthenticated);
  }

  function isProfileComplete() {
    const u = _read(USER_KEY);
    return !!(u && u.name);
  }

  function getProfile() {
    return _read(USER_KEY) || {};
  }

  /**
   * Simulated sign-up.
   * In the future this would POST /api/auth/signup
   */
  async function signUp({ name, email, password, phone }) {
    const existing = _read(AUTH_KEY);
    if (existing && existing.email === email) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);

    // Store account registration
    const account = {
      name,
      email,
      phone: phone || "",
      passwordHash,
      createdAt: Date.now()
    };
    _write(AUTH_KEY, account);

    // Create session
    const session = { email, isAuthenticated: true };
    _write(SESS_KEY, session);

    return session;
  }

  /**
   * Simulated login.
   * In the future this would POST /api/auth/login
   */
  async function logIn({ email, password }) {
    const account = _read(AUTH_KEY);
    if (!account || account.email !== email) {
      throw new Error("No account found with this email. Please sign up first.");
    }

    const passwordHash = await hashPassword(password);
    if (account.passwordHash !== passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    // Create session
    const session = { email, isAuthenticated: true };
    _write(SESS_KEY, session);

    return session;
  }

  /**
   * Save profile data.
   * In the future this would PUT /api/profile
   */
  function saveProfile(data) {
    const existing = getProfile();
    const merged = { ...existing, ...data };
    _write(USER_KEY, merged);
    return merged;
  }

  /**
   * Update avatar initial based on profile or account name.
   */
  function getInitial() {
    const p = getProfile();
    const a = _read(AUTH_KEY);
    const name = (p && p.name) || (a && a.name) || "";
    return name.charAt(0).toUpperCase() || "U";
  }

  /**
   * Logout — clear session only. Account and profile persist.
   */
  function logOut() {
    localStorage.removeItem(SESS_KEY);
  }

  /**
   * Protect a page — redirect to login if not authenticated.
   */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  /**
   * Redirect to profile setup if profile is incomplete.
   */
  function requireProfile() {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    if (!isProfileComplete()) {
      window.location.href = "profile.html";
      return false;
    }
    return true;
  }

  return {
    getAccount,
    getSession,
    isLoggedIn,
    isProfileComplete,
    getProfile,
    getInitial,
    signUp,
    logIn,
    saveProfile,
    logOut,
    requireAuth,
    requireProfile
  };
})();