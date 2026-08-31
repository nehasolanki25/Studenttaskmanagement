const API_BASE = "https://studenttaskmanagement-nk7z.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE}${endpoint}`,
      {
        ...options,
        headers
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to StudyTrack server"
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    clearAuth();

    const page = location.pathname;

    if (
      page !== "/" &&
      !page.endsWith("index.html")
    ) {
      location.href = "/";
    }

    throw new Error(
      data.message ||
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Request failed"
    );
  }

  return data;
}

function requireAuth() {
  if (!getToken()) {
    location.href = "/";
    return false;
  }

  return true;
}

function logout() {
  clearAuth();
  location.href = "/";
}

function showToast(
  message,
  type = "success"
) {
  let container =
    document.getElementById(
      "toastContainer"
    );

  if (!container) {
    container =
      document.createElement("div");

    container.id =
      "toastContainer";

    document.body.appendChild(
      container
    );
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.textContent =
    message;

  container.appendChild(
    toast
  );

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-CA"
  );
}

function formatLongDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}

function getLocalDateString(dateValue) {
  if (!dateValue) {
    return "";
  }

  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateValue
    )
  ) {
    return dateValue;
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function initials(
  name = "Student"
) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      part =>
        part[0].toUpperCase()
    )
    .join("") || "ST";
}

function setupCommonUI() {
  const user =
    getStoredUser();

  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(el => {
      el.textContent =
        user?.name ||
        "Student";
    });

  document
    .querySelectorAll(
      "[data-user-email]"
    )
    .forEach(el => {
      el.textContent =
        user?.email ||
        "";
    });

  document
    .querySelectorAll(
      "[data-user-initials]"
    )
    .forEach(el => {
      el.textContent =
        initials(user?.name);
    });

  document
    .querySelectorAll(
      "[data-logout]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        logout
      );
    });
}
