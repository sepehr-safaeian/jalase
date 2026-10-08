import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NoteSearchHit, NoteSearchScope } from '@jalase/shared';
import {
  NOTE_SEARCH_MIN_QUERY_LENGTH,
  NOTE_SEARCH_RECENT_DAYS,
  isValidSearchQuery,
  normalizeSearchQuery,
} from '@jalase/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { searchNotes } from '@/lib/api/search.api';
import { ApiError } from '@/lib/api/client';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { layout, radius, spacing } from '@/theme/tokens';
import { resolveFontFamily } from '@/theme/font-family';

type SearchPhase = 'idle' | 'typing' | 'loading' | 'results' | 'empty' | 'error';

export function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const textAlign = isRtl ? 'right' : 'left';
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<NoteSearchHit[]>([]);
  const [olderItems, setOlderItems] = useState<NoteSearchHit[]>([]);
  const [activeScope, setActiveScope] = useState<NoteSearchScope>('recent');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [expandableToOlder, setExpandableToOlder] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [committedQuery, setCommittedQuery] = useState('');

  const resetResults = useCallback(() => {
    setRecentItems([]);
    setOlderItems([]);
    setActiveScope('recent');
    setNextCursor(null);
    setHasMore(false);
    setExpandableToOlder(false);
  }, []);

  const runSearch = useCallback(
    async (
      searchQuery: string,
      scope: NoteSearchScope,
      cursor?: string | null,
      append = false,
    ) => {
      const normalized = normalizeSearchQuery(searchQuery);
      if (!isValidSearchQuery(normalized)) {
        resetResults();
        setPhase(normalized.length === 0 ? 'idle' : 'typing');
        setCommittedQuery('');
        return;
      }

      if (!append) {
        setPhase('loading');
        setErrorMessage(null);
        setCommittedQuery(normalized);
        if (scope === 'recent') {
          resetResults();
        }
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await searchNotes({
          q: normalized,
          scope,
          cursor: cursor ?? undefined,
        });

        if (scope === 'recent') {
          setRecentItems((prev) =>
            append ? [...prev, ...response.items] : response.items,
          );
          if (!append) {
            setOlderItems([]);
          }
        } else {
          setOlderItems((prev) =>
            append ? [...prev, ...response.items] : response.items,
          );
        }

        setActiveScope(response.scope);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setExpandableToOlder(response.expandableToOlder);

        if (!append && response.items.length === 0 && scope === 'recent') {
          setPhase('empty');
        } else {
          setPhase('results');
        }
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : t('search.failed');
        setErrorMessage(message);
        setPhase('error');
      } finally {
        setLoadingMore(false);
      }
    },
    [resetResults, t],
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    void runSearch(value, 'recent');
  }, 350);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleShowMore = () => {
    if (loadingMore || !committedQuery) return;

    if (hasMore && nextCursor) {
      void runSearch(committedQuery, activeScope, nextCursor, true);
      return;
    }

    if (expandableToOlder) {
      void runSearch(committedQuery, 'older');
    }
  };

  const showMoreLabel =
    hasMore && nextCursor
      ? t('search.showMore')
      : expandableToOlder
        ? t('search.searchOlder')
        : null;

  const listData: Array<
    | { type: 'section'; key: string; title: string }
    | { type: 'hit'; key: string; hit: NoteSearchHit }
  > = [];

  if (recentItems.length > 0) {
    listData.push({
      type: 'section',
      key: 'section-recent',
      title: t('search.sectionRecent', { days: NOTE_SEARCH_RECENT_DAYS }),
    });
    for (const hit of recentItems) {
      listData.push({ type: 'hit', key: `recent-${hit.id}`, hit });
    }
  }

  if (olderItems.length > 0) {
    listData.push({
      type: 'section',
      key: 'section-older',
      title: t('search.sectionOlder'),
    });
    for (const hit of olderItems) {
      listData.push({ type: 'hit', key: `older-${hit.id}`, hit });
    }
  }

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <AppHeader title={t('search.title')} />

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleQueryChange}
              placeholder={t('search.inputPlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="search"
              style={[
                styles.input,
                {
                  color: colors.textBody,
                  fontFamily: resolveFontFamily('400'),
                  textAlign,
                },
              ]}
              onSubmitEditing={() => {
                void runSearch(query, 'recent');
              }}
            />
          </View>

          {phase === 'idle' ? (
            <View style={styles.centerBox}>
              <Text variant="body" color="secondary" style={styles.centerText}>
                {t('search.idleBody')}
              </Text>
              <Text variant="uiSm" color="muted" style={styles.centerText}>
                {t('search.idleHint', { days: NOTE_SEARCH_RECENT_DAYS })}
              </Text>
            </View>
          ) : null}

          {phase === 'typing' ? (
            <View style={styles.centerBox}>
              <Text variant="body" color="muted" style={styles.centerText}>
                {t('search.minChars', { count: NOTE_SEARCH_MIN_QUERY_LENGTH })}
              </Text>
            </View>
          ) : null}

          {phase === 'loading' ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {phase === 'error' ? (
            <View style={styles.centerBox}>
              <Text variant="body" color="error" style={styles.centerText}>
                {errorMessage}
              </Text>
              <Button
                label={t('common.retry')}
                variant="secondary"
                onPress={() => void runSearch(query, 'recent')}
              />
            </View>
          ) : null}

          {phase === 'empty' ? (
            <View style={styles.centerBox}>
              <Text variant="headingSm" weight="700" style={styles.centerText}>
                {t('search.noRecent', { days: NOTE_SEARCH_RECENT_DAYS })}
              </Text>
              <Text variant="body" color="secondary" style={styles.centerText}>
                {t('search.tryOlderBody')}
              </Text>
              {expandableToOlder ? (
                <Button
                  label={t('search.searchOlder')}
                  variant="secondary"
                  onPress={() => void runSearch(committedQuery, 'older')}
                />
              ) : null}
            </View>
          ) : null}

          {phase === 'results' ? (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                if (item.type === 'section') {
                  return (
                    <Text
                      variant="ui"
                      weight="600"
                      color="secondary"
                      style={[styles.sectionTitle, { textAlign }]}
                    >
                      {item.title}
                    </Text>
                  );
                }

                return (
                  <SearchResultCard
                    hit={item.hit}
                    onPress={(hit) => router.push(`/notes/${hit.id}`)}
                  />
                );
              }}
              ListFooterComponent={
                showMoreLabel ? (
                  <Button
                    label={showMoreLabel}
                    variant="secondary"
                    loading={loadingMore}
                    onPress={handleShowMore}
                    style={styles.showMore}
                  />
                ) : null
              }
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  searchBox: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.base,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  centerText: {
    textAlign: 'center',
    lineHeight: 26,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  showMore: {
    marginTop: spacing.base,
  },
});
