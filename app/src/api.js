import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

let token = null;
export const setToken = async (t) => {
  token = t;
  if (t) await SecureStore.setItemAsync('token', t);
  else await SecureStore.deleteItemAsync('token');
};
export const loadToken = async () => (token = await SecureStore.getItemAsync('token'));

export async function api(method, path, body) {
  const res = await fetch(API_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
