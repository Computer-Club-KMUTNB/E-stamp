// Shared admin session helpers (sessionStorage-based)
export const ADMIN_SESSION_KEY = "admin_session";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.sessionStorage.getItem(ADMIN_SESSION_KEY);
}

export function adminLogin(email: string): void {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ email, loginAt: Date.now() }));
}

export function adminLogout(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
