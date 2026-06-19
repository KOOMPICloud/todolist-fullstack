export interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  _id?: string;
  sub?: string;
  id?: string;
  email?: string;
  fullname?: string;
  name?: string;
  avatar?: string;
  picture?: string;
  profile?: string;
  wallet_address?: string;
  [key: string]: unknown;
}
