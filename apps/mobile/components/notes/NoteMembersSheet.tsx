import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NoteMember, SpeakerNameMappings, SpeakerProfile } from '@jalase/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BottomSheet } from './BottomSheet';

interface NoteMembersSheetProps {
  visible: boolean;
  members: NoteMember[];
  speakers?: SpeakerProfile[];
  speakerMappings?: SpeakerNameMappings;
  onClose: () => void;
  onAdd: (displayName: string, email: string) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  onSaveSpeakerMappings?: (mappings: SpeakerNameMappings) => Promise<void>;
  onNotify?: (message: string) => void;
}

export function NoteMembersSheet({
  visible,
  members,
  speakers = [],
  speakerMappings = {},
  onClose,
  onAdd,
  onRemove,
  onSaveSpeakerMappings,
  onNotify,
}: NoteMembersSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const textAlign = isRtl ? 'right' : 'left';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const alignEnd = isRtl ? 'flex-end' : 'flex-start';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakerSaving, setSpeakerSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const speakerRows = useMemo(() => speakers, [speakers]);
  const hasSpeakers = speakerRows.length > 0;

  useEffect(() => {
    if (!visible) {
      setShowAddForm(false);
      return;
    }
    const next: Record<string, string> = {};
    for (const speaker of speakerRows) {
      next[speaker.speakerId] =
        speakerMappings[speaker.speakerId] ?? speaker.displayName ?? '';
    }
    setDraftNames(next);
    setSpeakerError(null);
  }, [speakerMappings, speakerRows, visible]);

  async function handleAdd() {
    const name = displayName.trim();
    const mail = email.trim();
    if (name.length < 2 || !mail.includes('@')) {
      setError(t('notes.memberInvalid'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onAdd(name, mail);
      setDisplayName('');
      setEmail('');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notes.memberAddFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSpeakers() {
    if (!onSaveSpeakerMappings) return;

    const mappings: SpeakerNameMappings = {};
    for (const speaker of speakerRows) {
      const name = draftNames[speaker.speakerId]?.trim() ?? '';
      if (name.length >= 2) {
        mappings[speaker.speakerId] = name;
      }
    }

    setSpeakerSaving(true);
    setSpeakerError(null);
    try {
      await onSaveSpeakerMappings(mappings);
      onNotify?.(t('notes.speakersSaved'));
      onClose();
    } catch (err) {
      setSpeakerError(
        err instanceof Error ? err.message : t('notes.speakersSaveFailed'),
      );
    } finally {
      setSpeakerSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} title={t('notes.members')} onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasSpeakers ? (
          <View style={styles.section}>
            <View style={styles.speakerList}>
              {speakerRows.map((speaker) => (
                <View
                  key={speaker.speakerId}
                  style={[styles.speakerBlock, { alignItems: alignEnd }]}
                >
                  <Text variant="uiSm" color="quiet">
                    {speaker.defaultLabel}
                  </Text>
                  <Input
                    placeholder={t('notes.speakerPlaceholder')}
                    value={draftNames[speaker.speakerId] ?? ''}
                    onChangeText={(value) =>
                      setDraftNames((prev) => ({
                        ...prev,
                        [speaker.speakerId]: value,
                      }))
                    }
                  />
                </View>
              ))}
            </View>

            {speakerError ? (
              <Text variant="uiSm" color="error" style={{ textAlign }}>
                {speakerError}
              </Text>
            ) : null}

            <Button
              label={t('notes.saveSpeakers')}
              loading={speakerSaving}
              onPress={() => void handleSaveSpeakers()}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.section,
            hasSpeakers && [styles.sectionSpaced, { borderTopColor: colors.border }],
          ]}
        >
          {members.length === 0 ? (
            <Text
              variant="body"
              color="quiet"
              style={[styles.empty, { textAlign }]}
            >
              {t('notes.noMembers')}
            </Text>
          ) : (
            <View style={styles.memberList}>
              {members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberRow, { flexDirection: rowDirection }]}
                >
                  <View style={[styles.memberInfo, { alignItems: alignEnd }]}>
                    <Text variant="body" weight="500">
                      {member.displayName}
                    </Text>
                    <Text variant="uiSm" color="quiet" style={styles.email}>
                      {member.email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void onRemove(member.id)}
                    hitSlop={12}
                    style={({ pressed }) => ({ opacity: pressed ? 0.45 : 1 })}
                  >
                    <Text variant="uiSm" color="quiet">
                      {t('notes.removeMember')}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {showAddForm ? (
            <View style={styles.form}>
              <Input
                placeholder={t('notes.memberName')}
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
              />
              <Input
                placeholder={t('notes.memberEmail')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error ?? undefined}
              />
              <Button
                label={t('notes.addMember')}
                loading={loading}
                onPress={() => void handleAdd()}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddForm(true)}
              style={({ pressed }) => [
                styles.addRow,
                { opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Text variant="body" color="muted">
                {t('notes.addMemberLink')}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  section: {
    gap: spacing.lg,
  },
  sectionSpaced: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  speakerList: {
    gap: spacing.xl,
  },
  speakerBlock: {
    gap: spacing.sm,
  },
  memberList: {
    gap: spacing.xl,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  email: {
    writingDirection: 'ltr',
  },
  empty: {
    paddingVertical: spacing.sm,
  },
  footer: {
    marginTop: spacing['2xl'],
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
});
