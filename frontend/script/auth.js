/* ============================================================
   auth.js — Authentication Service (API-backed)
   Communicates with Express.js backend
   ============================================================ */

const Auth = (() => {
  const USER_KEY = "closetlyUser";

  /* ---------- Helpers ---------- */
  function _read(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }

  function _write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ---------- Public API ---------- */
  function getAccount() {
    // For backward compatibility - returns user info from API token
    const user = getProfile();
    const token = Api.getAccessToken();
    if (!token || !user) return null;

    // Decode token to get email
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        email: payload.email,
        name: user.name,
        phone: user.phone || "",
      };
    } catch {
      return null;
    }
  }

  function getSession() {
    const token = Api.getAccessToken();
    return token && !Api.ApiError ? { isAuthenticated: true } : null;
  }

  function isLoggedIn() {
    return Api.auth.isLoggedIn();
  }

  function isProfileComplete() {
    const user = getProfile();
    return !!(user && user.name);
  }

  function getProfile() {
    return _read(USER_KEY) || {};
  }

  async function signUp({ name, email, password, phone }) {
    const data = await Api.auth.signup({ name, email, password, phone });
    _write(USER_KEY, data.user);
    return { email: data.user.email, isAuthenticated: true };
  }

  async function logIn({ email, password }) {
    const data = await Api.auth.login({ email, password });
    _write(USER_KEY, data.user);
    return { email: data.user.email, isAuthenticated: true };
  }

  async function saveProfile(data) {
    const existing = getProfile();
    const merged = { ...existing, ...data };
    
    // If we have a token, sync with backend
    if (Api.auth.isLoggedIn()) {
      try {
        const updated = await Api.auth.updateProfile(data);
        _write(USER_KEY, updated);
        return updated;
      } catch (error) {
        console.warn("Failed to sync profile with backend:", error);
        // Fallback to local storage
        _write(USER_KEY, merged);
        return merged;
      }
    }
    
    _write(USER_KEY, merged);
    return merged;
  }

  function getInitial() {
    const profile = getProfile();
    const account = getAccount();
    const name = (profile && profile.name) || (account && account.name) || "";
    return name.charAt(0).toUpperCase() || "U";
  }

  async function logOut() {
    try {
      await Api.auth.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    }
    localStorage.removeItem(USER_KEY);
    Api.clearTokens();
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

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

  // Initialize profile from backend on load
  async function initProfile() {
    if (Api.auth.isLoggedIn()) {
      try {
        const user = await Api.auth.getMe();
        _write(USER_KEY, user);
        return user;
      } catch (error) {
        console.warn("Failed to fetch profile:", error);
      }
    }
    return getProfile();
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
    requireProfile,
    initProfile,
  };
})();