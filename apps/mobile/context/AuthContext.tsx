import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, OtpVerifyResponse, UpdateProfileRequest, UpdateUserSettingsRequest } from '@jalase/shared';
import { isProfileComplete } from '@jalase/shared';
import * as authApi from '@/lib/api/auth.api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth/token-storage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signIn: (payload: OtpVerifyResponse) => Promise<void>;
  completeProfile: (displayName: string) => Promise<void>;
  updateProfile: (payload: UpdateProfileRequest) => Promise<AuthUser>;
  updateSettings: (payload: UpdateUserSettingsRequest) => Promise<AuthUser>;
  uploadAvatar: (uri: string, mimeType?: string) => Promise<AuthUser>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const me = await authApi.getMe(token);
      setUser(me);
    } catch {
      await clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (payload: OtpVerifyResponse) => {
    await setAccessToken(payload.accessToken);
    setUser(payload.user);
  }, []);

  const completeProfile = useCallback(async (displayName: string) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('نشست منقضی شده است');
    }
    const updated = await authApi.updateProfile(token, { displayName });
    setUser(updated);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfileRequest) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('نشست منقضی شده است');
    }
    const updated = await authApi.updateProfile(token, payload);
    setUser(updated);
    return updated;
  }, []);

  const updateSettings = useCallback(async (payload: UpdateUserSettingsRequest) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('نشست منقضی شده است');
    }
    const updated = await authApi.updateSettings(token, payload);
    setUser(updated);
    return updated;
  }, []);

  const uploadAvatar = useCallback(async (uri: string, mimeType?: string) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('نشست منقضی شده است');
    }
    const updated = await authApi.uploadAvatar(token, uri, mimeType);
    setUser(updated);
    return updated;
  }, []);

  const deleteAccount = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('نشست منقضی شده است');
    }
    await authApi.deleteAccount(token);
    await clearAccessToken();
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    await clearAccessToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.getMe(token);
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isProfileComplete: user ? isProfileComplete(user) : false,
      signIn,
      completeProfile,
      updateProfile,
      updateSettings,
      uploadAvatar,
      deleteAccount,
      signOut,
      refreshUser,
    }),
    [
      user,
      isLoading,
      signIn,
      completeProfile,
      updateProfile,
      updateSettings,
      uploadAvatar,
      deleteAccount,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
