import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDisplayName } from '@jalase/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  formatPhoneForDisplay,
  getUserInitials,
  resolveApiAssetUrl,
} from '@/lib/user/profile.utils';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
}

function DeleteAccountModal({
  visible,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border, direction },
          ]}
        >
          <Text variant="headingSm" weight="700" style={{ textAlign }}>
            {t('profile.deleteConfirmTitle')}
          </Text>
          <Text
            variant="body"
            color="secondary"
            style={[styles.modalBody, { textAlign }]}
          >
            {t('profile.deleteConfirmBody')}
          </Text>

          <View style={styles.modalActions}>
            <Button
              label={t('profile.cancel')}
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={styles.modalButton}
            />
            <Button
              label={t('profile.deleteAccount')}
              variant="destructive"
              loading={loading}
              onPress={onConfirm}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { textAlign } = useLayoutDirection();
  const { user, updateProfile, uploadAvatar, deleteAccount } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });

  const [form, setForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
    });
    setAvatarPreview(resolveApiAssetUrl(user.avatarUrl));
  }, [user]);

  const displayName = useMemo(
    () => (user ? getDisplayName(user) : ''),
    [user],
  );

  const isDirty = useMemo(() => {
    if (!user) {
      return false;
    }

    return (
      form.firstName.trim() !== (user.firstName ?? '') ||
      form.lastName.trim() !== (user.lastName ?? '') ||
      form.email.trim() !== (user.email ?? '')
    );
  }, [form, user]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  async function handlePickAvatar() {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('profile.avatarPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setAvatarPreview(asset.uri);
    setUploadingAvatar(true);

    try {
      await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
      setSuccess(t('profile.avatarSaved'));
    } catch (err) {
      setAvatarPreview(resolveApiAssetUrl(user?.avatarUrl ?? null));
      const message =
        err instanceof Error ? err.message : t('profile.avatarFailed');
      setError(message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (firstName.length < 2) {
      setError(t('profile.nameMin'));
      return;
    }

    if (lastName.length < 2) {
      setError(t('profile.lastNameMin'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        firstName,
        lastName,
        email: email || null,
      });
      setSuccess(t('profile.saved'));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('profile.saveFailed');
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      setDeleteModalVisible(false);
      router.replace('/login/phone');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('profile.deleteFailed');
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen scroll keyboard>
      <AppHeader title={t('profile.title')} />

      <View style={styles.avatarSection}>
        <Pressable
          onPress={() => void handlePickAvatar()}
          disabled={uploadingAvatar}
          style={({ pressed }) => [
            styles.avatarButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityLabel={t('profile.changeAvatar')}
          accessibilityRole="button"
        >
          {avatarPreview ? (
            <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
          ) : (
            <View
              style={[styles.avatarFallback, { backgroundColor: colors.primaryTint }]}
            >
              <Text variant="headingMd" weight="700" style={{ color: colors.primary }}>
                {getUserInitials(displayName)}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.avatarBadge,
              { backgroundColor: colors.primary, borderColor: colors.surface },
            ]}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Feather name="camera" size={16} color={colors.primaryText} />
            )}
          </View>
        </Pressable>

        <Text variant="body" weight="600" style={styles.avatarHint}>
          {displayName || t('profile.yourProfile')}
        </Text>
        <Text variant="uiSm" color="muted">
          {t('profile.changeAvatarHint')}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formFields}>
          <Input
            label={t('profile.firstName')}
            value={form.firstName}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, firstName: value }));
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
            placeholder={t('profile.firstName')}
            autoComplete={Platform.OS === 'web' ? 'given-name' : 'name-given'}
          />

          <Input
            label={t('profile.lastName')}
            value={form.lastName}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, lastName: value }));
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
            placeholder={t('profile.lastName')}
            autoComplete={Platform.OS === 'web' ? 'family-name' : 'name-family'}
          />

          <View style={styles.readOnlyField}>
            <Text variant="uiSm" weight="500" color="primary" style={{ textAlign }}>
              {t('profile.phone')}
            </Text>
            <View
              style={[
                styles.readOnlyInput,
                {
                  flexDirection: 'row',
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                variant="body"
                color="secondary"
                style={[styles.readOnlyText, { textAlign }]}
              >
                {formatPhoneForDisplay(user.phone)}
              </Text>
              <Feather name="lock" size={16} color={colors.textMuted} />
            </View>
            <Text variant="uiSm" color="muted" style={{ textAlign }}>
              {t('profile.phoneReadOnly')}
            </Text>
          </View>

          <Input
            label={t('profile.email')}
            value={form.email}
            onChangeText={(value) => {
              setForm((current) => ({ ...current, email: value }));
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>
      </Card>

      {error ? (
        <Text variant="uiSm" color="error" style={{ textAlign }}>
          {error}
        </Text>
      ) : null}

      {success ? (
        <Text variant="uiSm" style={{ textAlign, color: colors.primaryMid }}>
          {success}
        </Text>
      ) : null}

      {isDirty ? (
        <Button
          label={t('profile.saveChanges')}
          loading={saving}
          onPress={() => void handleSave()}
          style={styles.saveButton}
        />
      ) : null}

      <View style={styles.dangerZone}>
        <Text variant="uiSm" color="muted" style={{ textAlign }}>
          {t('profile.dangerZone')}
        </Text>
        <Pressable
          onPress={() => setDeleteModalVisible(true)}
          style={({ pressed }) => [
            styles.deleteRow,
            {
              flexDirection: 'row',
              borderColor: colors.error,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('profile.deleteAccount')}
        >
          <Feather name="trash-2" size={18} color={colors.error} />
          <Text variant="body" weight="600" style={{ color: colors.error }}>
            {t('profile.deleteAccount')}
          </Text>
        </Pressable>
      </View>

      <DeleteAccountModal
        visible={deleteModalVisible}
        loading={deleting}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarButton: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    marginTop: spacing.sm,
  },
  formCard: {
    gap: spacing.elementGap,
  },
  formFields: {
    gap: spacing.lg,
  },
  readOnlyField: {
    gap: spacing.sm,
  },
  readOnlyInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  readOnlyText: {
    flex: 1,
  },
  saveButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  dangerZone: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
    paddingBottom: spacing.section,
  },
  deleteRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 12, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.cardPadding,
    gap: spacing.lg,
  },
  modalBody: {
    lineHeight: 24,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalButton: {
    width: '100%',
  },
});
