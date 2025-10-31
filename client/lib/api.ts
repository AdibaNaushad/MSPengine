let token: string | null = null;

// Initialize token from localStorage on first access
function initToken() {
  if (token === null && typeof localStorage !== "undefined") {
    try {
      token = localStorage.getItem("auth_token");
    } catch {
      token = null;
    }
  }
  return token;
}

export function setToken(t: string) {
  token = t;
  try {
    localStorage.setItem("auth_token", t);
  } catch (e) {
    console.error("Failed to save token to localStorage:", e);
  }
}

export function getToken() {
  return initToken();
}

export function logout() {
  token = null;
  try {
    localStorage.removeItem("auth_token");
  } catch (e) {
    console.error("Failed to remove token from localStorage:", e);
  }
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const currentToken = getToken();
  const headers = currentToken
    ? { Authorization: `Bearer ${currentToken}` }
    : {};

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(path, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    let data: any;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      data = {};
    }

    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data as T;
  } catch (error) {
    console.error(`API GET ${path} failed:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const currentToken = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data: any;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      data = {};
    }

    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data as T;
  } catch (error) {
    console.error(`API POST ${path} failed:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
