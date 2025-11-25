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
    // First, perform custom password validation.
    const passwordErrors = this.validatePassword(password);
    if (passwordErrors.length > 0) {
      // If custom validation fails, throw the specific error message from the validator.
      throw new Error(passwordErrors[0]);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/login`,
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

  validatePassword = (password: string): string[] => {
    // This single regex checks for all conditions:
    // - (?=.*[a-z]): at least one lowercase letter
    // - (?=.*[A-Z]): at least one uppercase letter
    // - (?=.*\d): at least one number
    // - (?=.*[^A-Za-z0-9]): at least one special character (anything not a letter or number)
    // - .{8,}: at least 8 characters long
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (passwordRegex.test(password)) {
      return []; // Password is valid, no errors.
    } else {
      return ["Password must be at least 8 characters and include one uppercase, one lowercase, one number, and one special character."];
    }
  };

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }

  // Initialize auth state listener
  initAuthListener(callback: (user: AuthUser | null) => void) {
    // Handle initial session from URL hash (email confirmation)
    const handleInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthService: Error getting session:", error);
          return;
        }

        if (session?.user) {
          console.log("AuthService: Initial session found, user:", session.user.email);
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
      } catch (error) {
        console.error("AuthService: Error handling initial session:", error);
        callback(null);
      }
    };

    // Handle initial session first
    handleInitialSession();

    // Then set up the auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthService: Auth state change event:", event, !!session?.user);

      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        };
        if (event === 'SIGNED_IN') {
          console.log("AuthService: User signed in:", user.email);
          callback(user);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("AuthService: User signed out");
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
