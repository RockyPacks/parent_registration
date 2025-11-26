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

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async signup(fullName: string, email: string, password: string): Promise<AuthResponse> {
    // Password validation: at least 8 characters with 1 uppercase, 1 lowercase, 1 special character
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter.');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter.');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new Error('Password must contain at least one special character.');
    }

    try {
      // Determine the redirect URL - use environment variable or current origin
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const emailRedirectUrl = `${redirectUrl}/login`;
      
      console.log('Signup: Email redirect URL:', emailRedirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: emailRedirectUrl,
        },
      });

      // If Supabase returns an error, throw it. This is the key change.
      if (error) {
        throw new Error(error.message);
      }

      const user: AuthUser = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        full_name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '',
      };

      // After signup with email confirmation, the session is null.
      // We return the user data but the access_token will be empty,
      // indicating that the user needs to confirm their email.
      return {
        access_token: data.session?.access_token || '',
        token_type: 'bearer',
        user,
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw the error (either from Supabase or another issue) to be handled by the UI.
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Initialize auth state listener with user-specific session management
  initAuthListener(callback: (user: AuthUser | null) => void) {
    let isInitialized = false;

    // Handle initial session from URL hash (email confirmation)
    const handleInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthService: Error getting session:", error);
          return;
        }

        if (session?.user) {
          console.log("AuthService: Initial session found for user:", session.user.email);
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          };
          callback(user);
        } else {
          console.log("AuthService: No initial session found");
          callback(null);
        }
        isInitialized = true;
      } catch (error) {
        console.error("AuthService: Error handling initial session:", error);
        callback(null);
        isInitialized = true;
      }
    };

    // Handle initial session first
    handleInitialSession();

    // Then set up the auth state change listener
    // Note: With sessionStorage, this only affects the current tab
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthService: Auth state change event:", event, !!session?.user, "(tab-specific)");

      // Skip the initial SIGNED_IN event if we already handled it in handleInitialSession
      if (event === 'SIGNED_IN' && !isInitialized) {
        return;
      }

      // Only respond to explicit sign in/out events, not token refresh events
      if (event === 'SIGNED_IN' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        };
        console.log("AuthService: User signed in (current tab only):", user.email);
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        console.log("AuthService: User signed out (current tab only)");
        callback(null);
      }
      // Ignore TOKEN_REFRESHED and other events to prevent unnecessary reloads
    });
  }
}

export const authService = new AuthService();
