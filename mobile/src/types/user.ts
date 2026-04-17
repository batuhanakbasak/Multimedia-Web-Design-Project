export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  profile_image: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}
