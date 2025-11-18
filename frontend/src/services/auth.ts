import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session?.access_token) {
        throw new Error('No access token received');
      }

      const user: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        full_name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '',
      };

      const response: AuthResponse = {
        access_token: data.session.access_token,
        token_type: 'bearer',
        user,
      };

      // Store in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async signup(fullName: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session?.access_token) {
        // User might need to confirm email
        throw new Error('Please check your email to confirm your account before logging in.');
      }

      const user: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        full_name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '',
      };

      const response: AuthResponse = {
        access_token: data.session.access_token,
        token_type: 'bearer',
        user,
      };

      // Store in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }

      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('applicationId');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Initialize auth state listener
  initAuthListener(callback: (user: AuthUser | null) => void) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthService: Auth state change event:", event, !!session?.user);

      if (event === 'SIGNED_IN' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        };
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log("AuthService: User signed in:", user.email);
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        console.log("AuthService: User signed out");
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        callback(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log("AuthService: Token refreshed");
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        };
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('user', JSON.stringify(user));
        // Don't call callback for token refresh to avoid unnecessary re-renders
      }
    });
  }
}

export const authService = new AuthService();
