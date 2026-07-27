// Shared admin session helpers (sessionStorage-based)
export const ADMIN_SESSION_KEY = "admin_session";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.sessionStorage.getItem(ADMIN_SESSION_KEY);
}

export function getAdminCredentials(): { email: string; pass: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function adminLogin(email: string, pass: string): void {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ email, pass, loginAt: Date.now() }));
}

export function adminLogout(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
