import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { MeetingItem } from './types';

interface MeetingCardProps {
  meeting: MeetingItem;
  variant?: 'recent' | 'upcoming';
  onPress?: (meeting: MeetingItem) => void;
}

export function MeetingCard({
  meeting,
  variant = 'recent',
  onPress,
}: MeetingCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const align = isRtl ? 'right' : 'left';
  const contentAlign = isRtl ? 'flex-end' : 'flex-start';

  const metaLabel =
    variant === 'upcoming' && meeting.scheduleLabel
      ? meeting.scheduleLabel
      : `${meeting.time} · ${t('home.attendeeCount', { count: meeting.attendeeCount })}`;

  return (
    <TouchableOpacity
      activeOpacity={0.985}
      onPress={() => onPress?.(meeting)}
      style={[
        styles.card,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.content, { alignItems: contentAlign }]}>
        <Text
          variant="body"
          weight="600"
          style={[styles.title, { textAlign: align }]}
          numberOfLines={2}
        >
          {meeting.title}
        </Text>
        <Text
          variant="uiSm"
          color="muted"
          style={{ textAlign: align }}
        >
          {metaLabel}
        </Text>
        {variant === 'upcoming' ? (
          <View
            style={[
              styles.badge,
              {
                alignSelf: contentAlign,
                backgroundColor: colors.primaryTint,
                borderColor: colors.border,
              },
            ]}
          >
            <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
              {t('home.scheduled')}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.dateBadge,
          {
            backgroundColor: colors.surfaceSoft,
            borderColor: colors.border,
          },
        ]}
      >
        <Text variant="headingSm" weight="700" style={styles.day}>
          {meeting.day}
        </Text>
        <Text variant="uiSm" color="secondary" weight="500">
          {meeting.month}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
  dateBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  day: {
    lineHeight: 24,
  },
});
