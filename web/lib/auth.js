export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('earnify_token');
}

export function setToken(token) {
  window.localStorage.setItem('earnify_token', token);
}

export function clearToken() {
  window.localStorage.removeItem('earnify_token');
}
