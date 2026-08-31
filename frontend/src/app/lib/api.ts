// lib/api.ts
export const API_BASE_URL= 'https://aabharan.vercel.app';
const PRODUCTS_PATH = '/api/storeadmin/products';
const SETTINGS_PATH = '/api/storeadmin/settings';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('storeadmin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentStoreId(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('storeadmin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store Settings API Methods
// ---------------------------------------------------------------------------

export async function fetchStoreSettings() {
  const res = await fetch(`${API_BASE_URL}${SETTINGS_PATH}`, {
    headers: { ...authHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch store settings (${res.status})`);
  }

  const data = await res.json();
  return data.store;
}

export async function updateStoreSettings(payload: {
  name: string;
  about?: string;
  contactNumber?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
  };
}) {
  const res = await fetch(`${API_BASE_URL}${SETTINGS_PATH}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update store settings (${res.status})`);
  }

  const data = await res.json();
  return data.store;
}

// Add/replace this function in lib/api.ts

export async function updateStoreAssets(formData: FormData) {
  const res = await fetch(`https://aabharan.vercel.app/api/storeadmin/settings/assets`, {
    method: 'POST',
    headers: { ...authHeaders() }, // no Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update store assets (${res.status})`);
  }

  const data = await res.json();
  return data.data; // matches { success: true, data: { logo, coverBanner } } from the route
}
// ---------------------------------------------------------------------------
// Branch API Methods
// ---------------------------------------------------------------------------

export async function createBranch(branchData: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}${SETTINGS_PATH}/branches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(branchData),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create branch (${res.status})`);
  }

  const data = await res.json();
  return data.branch;
}

export async function updateBranch(id: string, branchData: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}${SETTINGS_PATH}/branches/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(branchData),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update branch (${res.status})`);
  }

  const data = await res.json();
  return data.branch;
}

export async function deleteBranch(id: string) {
  const res = await fetch(`${API_BASE_URL}${SETTINGS_PATH}/branches/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete branch (${res.status})`);
  }

  return true;
}

// ---------------------------------------------------------------------------
// Product API Methods
// ---------------------------------------------------------------------------

export async function fetchProducts(storeId?: string) {
  const url = new URL(`${API_BASE_URL}${PRODUCTS_PATH}`);
  if (storeId) url.searchParams.set('storeId', storeId);

  const res = await fetch(url.toString(), {
    headers: { ...authHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch products (${res.status})`);
  }

  const data = await res.json();
  return data.products as Array<Record<string, any>>;
}

export async function createProduct(formData: FormData) {
  const res = await fetch(`${API_BASE_URL}${PRODUCTS_PATH}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create product (${res.status})`);
  }

  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: string, formData: FormData) {
  const res = await fetch(`${API_BASE_URL}${PRODUCTS_PATH}/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update product (${res.status})`);
  }

  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_BASE_URL}${PRODUCTS_PATH}/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete product (${res.status})`);
  }

  return true;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/api/storeadmin/settings/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to change password (${res.status})`);
  }

  const data = await res.json();
  return data.message as string;
}