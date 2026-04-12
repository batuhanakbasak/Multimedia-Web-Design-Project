import type {
  AuthPayload,
  LoginRequest,
  RefreshTokenRequest,
  RegisterStudentRequest,
} from '../types/auth';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/user';

import { apiClient, publicApiClient } from './api';

export const studentRegister = async (payload: RegisterStudentRequest) => {
  const response = await publicApiClient.post<ApiResponse<{ user: User }>>(
    '/auth/register/student',
    payload
  );

  return response.data.data;
};

export const studentLogin = async (payload: LoginRequest) => {
  const response = await publicApiClient.post<ApiResponse<AuthPayload>>(
    '/auth/login/student',
    payload
  );

  return response.data.data;
};

export const organizerLogin = async (payload: LoginRequest) => {
  const response = await publicApiClient.post<ApiResponse<AuthPayload>>(
    '/auth/login/organizer',
    payload
  );

  return response.data.data;
};

export const refreshTokenRequest = async (payload: RefreshTokenRequest) => {
  const response = await publicApiClient.post<ApiResponse<AuthPayload>>(
    '/auth/refresh',
    payload
  );

  return response.data.data;
};

export const logoutRequest = async (refreshToken: string) => {
  await publicApiClient.post<ApiResponse<null>>('/auth/logout', {
    refresh_token: refreshToken,
  });
};

export const getCurrentUser = async () => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};
