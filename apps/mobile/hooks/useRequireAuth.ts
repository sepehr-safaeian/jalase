import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface RequireAuthOptions {
  requireProfile?: boolean;
  redirectIfProfileComplete?: boolean;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, isProfileComplete } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login/phone');
      return;
    }

    if (options.redirectIfProfileComplete && isProfileComplete) {
      router.replace('/dashboard');
      return;
    }

    if (options.requireProfile && !isProfileComplete) {
      router.replace('/auth/complete-profile');
    }
  }, [
    isLoading,
    isAuthenticated,
    isProfileComplete,
    options.requireProfile,
    options.redirectIfProfileComplete,
    router,
  ]);

  return { isLoading, isAuthenticated, isProfileComplete };
}
