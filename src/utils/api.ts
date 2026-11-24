import {
  AdminRecord,
  AuthSessionUser,
  Donation,
  DonationPurpose,
  DonationStatus,
  MathBootstrapData,
  Member,
  MemberStatus,
  Post,
  PostCategory,
} from '../types';

let memoryBearerToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryBearerToken = token;
}

export function getAuthToken(): string | null {
  return memoryBearerToken;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options ?? {};
  const authHeader: Record<string, string> = memoryBearerToken
    ? { Authorization: `Bearer ${memoryBearerToken}` }
    : {};

  const res = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(customHeaders as Record<string, string> | undefined),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  requestOtp(phone: string): Promise<{
    ok: boolean;
    phone: string;
    demoOtp: string;
    expiresInSeconds: number;
  }> {
    return requestJson('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{ token: string; user: AuthSessionUser }> {
    return requestJson('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  firebaseLogin(idToken: string): Promise<{ token: string; user: AuthSessionUser }> {
    return requestJson('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  setupAdminPin(pin: string): Promise<{ user: AuthSessionUser }> {
    return requestJson('/api/auth/setup-admin-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  verifyAdminPin(pin: string): Promise<{ user: AuthSessionUser }> {
    return requestJson('/api/auth/verify-admin-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return requestJson('/api/auth/logout', { method: 'POST' });
  },

  fetchBootstrap(): Promise<MathBootstrapData> {
    return requestJson<MathBootstrapData>('/api/bootstrap');
  },

  createPost(payload: {
    authorName: string;
    authorGotra?: string;
    authorCity?: string;
    category: PostCategory;
    title: string;
    content: string;
    imageUrl?: string;
  }): Promise<Post> {
    return requestJson<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleLike(postId: string, delta: 1 | -1): Promise<Post> {
    return requestJson<Post>(`/api/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    });
  },
