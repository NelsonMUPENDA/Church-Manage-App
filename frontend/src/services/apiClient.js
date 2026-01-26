import axios from 'axios';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';

const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function _safeParseUrl(value) {
  try {
    return new URL(String(value));
  } catch (e) {
    return null;
  }
}

const _detectedHostBaseUrl = (typeof window !== 'undefined' && window?.location?.hostname)
  ? `http://${window.location.hostname}:8000`
  : DEFAULT_API_BASE_URL;

const _envBaseUrl = process.env.REACT_APP_API_URL;

const _envParsed = _envBaseUrl ? _safeParseUrl(_envBaseUrl) : null;
const _envIsLocalhost = !!_envParsed && (_envParsed.hostname === 'localhost' || _envParsed.hostname === '127.0.0.1');
const _openedFromLan = (typeof window !== 'undefined' && window?.location?.hostname)
  ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  : false;

export const API_BASE_URL = (_envBaseUrl && !(_envIsLocalhost && _openedFromLan)) ? _envBaseUrl : _detectedHostBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pending = [];

function resolvePending(err, token) {
  pending.forEach((p) => {
    if (err) p.reject(err);
    else p.resolve(token);
  });
  pending = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    if (status !== 401) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/token/refresh/`,
        { refresh },
        { timeout: 20000 }
      );

      const newAccess = res.data?.access;
      if (!newAccess) throw new Error('No access token returned by refresh');

      setTokens({ access: newAccess, refresh });
      resolvePending(null, newAccess);

      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (e) {
      resolvePending(e, null);
      clearTokens();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export async function apiLogin(username, password) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/token/`, { username, password });
  return res.data;
}

export async function apiMe() {
  const res = await api.get('/api/me/');
  return res.data;
}
