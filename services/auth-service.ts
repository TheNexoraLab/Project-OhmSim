export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'BUYER' | 'ADMIN';
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  contactNumber?: string;
  password: string;
}

export async function login(
  payload: LoginPayload
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to sign in.' };
    }
    return { success: true, user: data.user };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during sign-in.',
    };
  }
}

export async function register(
  payload: RegisterPayload
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create account.' };
    }
    return { success: true, user: data.user };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during registration.',
    };
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    return { success: res.ok, error: data.error };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during logout.',
    };
  }
}

export async function getMe(): Promise<{ authenticated: boolean; user: AuthUser | null }> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      return { authenticated: false, user: null };
    }
    const data = await res.json();
    return { authenticated: Boolean(data.authenticated), user: data.user || null };
  } catch {
    return { authenticated: false, user: null };
  }
}

/**
 * Initiates Log in with Google via Neon Auth (Managed Better Auth).
 * Redirects the user's browser directly to Google OAuth consent.
 */
export function loginWithGoogle(): void {
  if (typeof window !== 'undefined') {
    // External OAuth redirect - requires full browser navigation to trigger 302 redirect.
    // If user is accessing via 127.0.0.1, navigate to localhost so cookies and callbacks align with Neon Auth allowlists.
    let targetOrigin = window.location.origin;
    if (targetOrigin.includes('127.0.0.1')) {
      targetOrigin = targetOrigin.replace('127.0.0.1', 'localhost');
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${targetOrigin}/api/auth/google`);
  }
}
