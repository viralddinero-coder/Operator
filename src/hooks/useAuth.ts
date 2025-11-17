import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { authService } from '../services/api';
import { toast } from 'sonner';

export const useAuth = () => {
  const { user, profile, isAuthenticated, isLoading, setUser, setProfile, setLoading, setError, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          return;
        }

        if (session?.user) {
          // Get full user data from our database
          const { user: fullUser, profile: userProfile } = await authService.getUserProfile(session.user.id);
          setUser(fullUser);
          setProfile(userProfile);
        }
      } catch (error) {
        setError('Failed to check authentication');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Get full user data from our database
        const { user: fullUser, profile: userProfile } = await authService.getUserProfile(session.user.id);
        setUser(fullUser);
        setProfile(userProfile);
        toast.success('Välkommen tillbaka!');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        toast.info('Du har loggats ut');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading, setError]);

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await authService.signOut();
      if (error) throw error;
      
      storeLogout();
      toast.success('Du har loggats ut');
    } catch (error) {
      toast.error('Kunde inte logga ut');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    logout,
  };
};

export default useAuth;