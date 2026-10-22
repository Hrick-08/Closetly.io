/* ============================================================
   api.js — API Service Layer
   Communicates with Express.js backend and FastAPI microservice
   ============================================================ */

const Api = (() => {
  /* ---------- Configuration ---------- */
  const BACKEND_URL = "http://localhost:5000/api";
  const MICROSERVICE_URL = "http://localhost:8000";

  /* ---------- Token Management ---------- */
  const TOKEN_KEY = "closetly_access_token";
  const REFRESH_TOKEN_KEY = "closetly_refresh_token";

  function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  function setTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /* ---------- HTTP Helpers ---------- */
  async function request(endpoint, options = {}) {
    const url = `${BACKEND_URL}${endpoint}`;
    const token = getAccessToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token && !isTokenExpired(token)) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: "include", // For cookie-based auth
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - try to refresh token
      if (response.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login" && endpoint !== "/auth/signup") {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          config.headers["Authorization"] = `Bearer ${getAccessToken()}`;
          return fetch(url, config);
        } else {
          // Refresh failed, redirect to login
          clearTokens();
          window.location.href = "login.html";
          return;
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(response.status, data.message || "Request failed", data.errors);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new ApiError(0, "Network error. Please check your connection.");
      }
      throw new ApiError(0, error.message || "An unexpected error occurred");
    }
  }

  async function requestMultipart(endpoint, formData) {
    const url = `${BACKEND_URL}${endpoint}`;
    const token = getAccessToken();

    const headers = {};
    if (token && !isTokenExpired(token)) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${getAccessToken()}`;
          return fetch(url, { method: "POST", headers, body: formData, credentials: "include" });
        } else {
          clearTokens();
          window.location.href = "login.html";
          return;
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(response.status, data.message || "Request failed", data.errors);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, error.message || "An unexpected error occurred");
    }
  }

  async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
    return false;
  }

  /* ---------- Custom Error Class ---------- */
  class ApiError extends Error {
    constructor(status, message, errors = null) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.errors = errors;
    }
  }

  /* ---------- Auth API ---------- */
  const auth = {
    async signup({ name, email, password, phone }) {
      const data = await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      });
      if (data.data?.accessToken) {
        setTokens(data.data.accessToken, data.data.refreshToken);
      }
      return data.data;
    },

    async login({ email, password }) {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.data?.accessToken) {
        setTokens(data.data.accessToken, data.data.refreshToken);
      }
      return data.data;
    },

    async logout() {
      await request("/auth/logout", { method: "POST" });
      clearTokens();
    },

    async getMe() {
      const data = await request("/auth/me");
      return data.data.user;
    },

    async updateProfile({ name, phone, avatarUrl }) {
      const data = await request("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name, phone, avatarUrl }),
      });
      return data.data.user;
    },

    async changePassword({ currentPassword, newPassword }) {
      const data = await request("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return data.data;
    },

    async deleteAccount(password) {
      const data = await request("/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      clearTokens();
      return data.data;
    },

    isLoggedIn() {
      const token = getAccessToken();
      return !!token && !isTokenExpired(token);
    },

    getToken() {
      return getAccessToken();
    },
  };

  /* ---------- Wardrobe API ---------- */
  const wardrobe = {
    async getItems({ category, search, limit = 50, skip = 0, sortBy = "createdAt", sortOrder = "desc" } = {}) {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      params.append("limit", limit);
      params.append("skip", skip);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const data = await request(`/wardrobe/items?${params.toString()}`);
      return data.data;
    },

    async getItem(id) {
      const data = await request(`/wardrobe/items/${id}`);
      return data.data.item;
    },

    async createItem({ name, category, tags, color, brand, season, notes }) {
      const data = await request("/wardrobe/items", {
        method: "POST",
        body: JSON.stringify({ name, category, tags, color, brand, season, notes }),
      });
      return data.data.item;
    },

    async createItemWithImage(file, { name, category, tags, color, brand, season, notes }) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", name);
      formData.append("category", category);
      if (tags) formData.append("tags", JSON.stringify(tags));
      if (color) formData.append("color", JSON.stringify(color));
      if (brand) formData.append("brand", brand);
      if (season) formData.append("season", season);
      if (notes) formData.append("notes", notes);

      const data = await requestMultipart("/wardrobe/items/upload", formData);
      return data.data.item;
    },

    async updateItem(id, updates) {
      const data = await request(`/wardrobe/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return data.data.item;
    },

    async updateItemImage(id, file) {
      const formData = new FormData();
      formData.append("image", file);

      const data = await requestMultipart(`/wardrobe/items/${id}/upload`, formData);
      return data.data.item;
    },

    async deleteItem(id) {
      const data = await request(`/wardrobe/items/${id}`, {
        method: "DELETE",
      });
      return data.data;
    },

    async incrementWearCount(id) {
      const data = await request(`/wardrobe/items/${id}/wear`, {
        method: "POST",
      });
      return data.data.item;
    },

    async getCategories() {
      const data = await request("/wardrobe/categories");
      return data.data.categories;
    },

    async getStats() {
      const data = await request("/wardrobe/items/stats");
      return data.data;
    },
  };

  /* ---------- Microservice API (Classify, Search, Chat) ---------- */
  const microservice = {
    async searchProducts({ query, numResults = 10 }) {
      const data = await request("/microservice/search", {
        method: "POST",
        body: JSON.stringify({ query, numResults }),
      });
      return data.data;
    },

    async searchByImage(file, numResults = 10) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("numResults", numResults);

      const data = await requestMultipart("/microservice/search/image", formData);
      return data.data;
    },

    async classifyImage(file) {
      const formData = new FormData();
      formData.append("image", file);

      const data = await requestMultipart("/microservice/classify", formData);
      return data.data;
    },

    async chat(message, history = []) {
      const data = await request("/microservice/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      });
      return data.data;
    },

    async healthCheck() {
      const data = await request("/microservice/health");
      return data.data;
    },
  };

  /* ---------- Public API ---------- */
  return {
    auth,
    wardrobe,
    microservice,
    ApiError,
    setTokens,
    clearTokens,
    getAccessToken,
  };
})();

// Export for ES modules if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = Api;
}