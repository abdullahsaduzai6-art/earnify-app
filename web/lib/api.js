import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://earnify-server.vercel.app /api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const message = data?.error || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Connection error - cannot reach server at ${API_BASE}`);
    }
    throw error;
  }
}
