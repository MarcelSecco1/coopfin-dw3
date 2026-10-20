const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new Error(payload?.message || 'Não foi possível concluir a operação.');
  }
  return payload;
}

export const login = (username, password) => request('/auth/login', {
  method: 'POST', body: JSON.stringify({ username, password }),
});

export const getAllContas = (token) => request('/getAllContas', { token });
export const getContaByID = (id, token) => request(`/getContaByID/${id}`, { token });
export const insertConta = (data, token) => request('/insertConta', { method: 'POST', body: JSON.stringify(data), token });
export const updateConta = (id, data, token) => request(`/updateConta/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
export const deleteConta = (id, token) => request(`/deleteConta/${id}`, { method: 'DELETE', token });

export const getAllLancamentos = (token) => request('/getAllLancamentos', { token });
export const getLancamentoByID = (id, token) => request(`/getLancamentoByID/${id}`, { token });
export const insertLancamento = (data, token) => request('/insertLancamento', { method: 'POST', body: JSON.stringify(data), token });
export const updateLancamento = (id, data, token) => request(`/updateLancamento/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
export const deleteLancamento = (id, token) => request(`/deleteLancamento/${id}`, { method: 'DELETE', token });

export const contasApi = { getAll: getAllContas, getById: getContaByID, insert: insertConta, update: updateConta, remove: deleteConta };
export const lancamentosApi = { getAll: getAllLancamentos, getById: getLancamentoByID, insert: insertLancamento, update: updateLancamento, remove: deleteLancamento };
