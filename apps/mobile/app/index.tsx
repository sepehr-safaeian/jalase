import { Redirect } from 'expo-router';
import { LoginChooserScreen } from '@/components/auth/LoginChooserScreen';
import { useAuth } from '@/context/AuthContext';

export default function IndexPage() {
  const { isLoading, isAuthenticated, isProfileComplete } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    if (isProfileComplete) {
      return <Redirect href="/dashboard" />;
    }
    return <Redirect href="/auth/complete-profile" />;
  }

  return <LoginChooserScreen />;
}
