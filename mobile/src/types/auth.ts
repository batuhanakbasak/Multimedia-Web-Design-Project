import type { User } from './user';

export interface AuthPayload {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterStudentRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  profile_image?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
