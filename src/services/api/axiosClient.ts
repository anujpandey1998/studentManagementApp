import axios, { AxiosHeaders } from 'axios';
import { SUPABASE_URL } from '@env';
import { getSupabaseClient, getSupabaseConfig } from '../supabase/client';
import { normalizeApiError } from './apiError';

export const axiosInstance = axios.create({
  baseURL: SUPABASE_URL
    ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`
    : undefined,
  timeout: 15000,
});

axiosInstance.interceptors.request.use(async request => {
  const { publishableKey } = getSupabaseConfig();
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }

  const headers = AxiosHeaders.from(request.headers);
  headers.set('apikey', publishableKey);
  if (data.session) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  } else {
    headers.delete('Authorization');
  }
  request.headers = headers;
  return request;
});

axiosInstance.interceptors.response.use(
  response => response,
  error => Promise.reject(normalizeApiError(error)),
);
