const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";
export const TOKEN_KEY = "geumso_token";
export const USER_KEY = "geumso_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "요청 실패");
    err.status = res.status;
    throw err;
  }
  return data;
}

export { API_BASE };
