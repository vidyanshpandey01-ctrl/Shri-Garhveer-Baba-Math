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

  addComment(
    postId: string,
    payload: { authorName: string; authorCity?: string; text: string },
  ): Promise<Post> {
    return requestJson<Post>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  registerMember(payload: {
    name: string;
    gotra: string;
    phone: string;
    address: string;
    city: string;
    role?: string;
  }): Promise<Member> {
    return requestJson<Member>('/api/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  lookupMember(query: string): Promise<Member> {
    return requestJson<Member>(
      `/api/members/lookup?q=${encodeURIComponent(query)}`,
    );
  },

  submitDonation(payload: {
    donorName: string;
    phone: string;
    amount: number;
    purpose: DonationPurpose;
    utrReference: string;
  }): Promise<Donation> {
    return requestJson<Donation>('/api/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMemberStatus(memberId: string, status: MemberStatus): Promise<Member> {
    return requestJson<Member>(`/api/admin/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteMember(memberId: string): Promise<{ deletedId: string }> {
    return requestJson<{ deletedId: string }>(`/api/admin/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  togglePinPost(postId: string, pinned: boolean): Promise<Post> {
    return requestJson<Post>(`/api/admin/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned }),
    });
  },

  deletePost(postId: string): Promise<{ deletedId: string }> {
    return requestJson<{ deletedId: string }>(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  updateDonationStatus(
    donationId: string,
    status: DonationStatus,
  ): Promise<Donation> {
    return requestJson<Donation>(`/api/admin/donations/${donationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  grantAdminAccess(phone: string, name?: string): Promise<AdminRecord[]> {
    return requestJson<AdminRecord[]>('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ phone, name }),
    });
  },

  revokeAdminAccess(phone: string): Promise<AdminRecord[]> {
    return requestJson<AdminRecord[]>(
      `/api/admin/admins/${encodeURIComponent(phone)}`,
      { method: 'DELETE' },
    );
  },
};
