import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://lcubxwvkoqkhsvzstbay.supabase.co/functions/v1';

export interface CreateUserParams {
  username: string;
  password: string;
  name: string;
  position: string;
  role: 'admin' | 'viewer';
}

export interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    position: string;
    role: string;
  };
  error?: string;
}

export interface UpdatePasswordParams {
  userId: string;
  password: string;
}

export interface DeleteUserParams {
  userId: string;
}

export interface EdgeFunctionResponse {
  success: boolean;
  error?: string;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session');
  }
  return session.access_token;
}

export async function createUserViaEdgeFunction(params: CreateUserParams): Promise<CreateUserResponse> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${EDGE_FUNCTION_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling create-user edge function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateUserPasswordViaEdgeFunction(params: UpdatePasswordParams): Promise<EdgeFunctionResponse> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${EDGE_FUNCTION_URL}/update-user-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling update-user-password edge function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteUserViaEdgeFunction(params: DeleteUserParams): Promise<EdgeFunctionResponse> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${EDGE_FUNCTION_URL}/delete-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling delete-user edge function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}