import { StyleSheet, Text, View } from 'react-native';

import type { ApiMeta } from '../../types/api';
import { theme } from '../../constants/theme';

import { SecondaryButton } from './SecondaryButton';

interface PaginationFooterProps {
  meta?: ApiMeta;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const PaginationFooter = ({
  meta,
  loading = false,
  hasMore = false,
  onLoadMore,
}: PaginationFooterProps) => {
  if (!meta) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>
        Page {meta.page ?? 1}
        {meta.total_pages ? ` / ${meta.total_pages}` : ''}
        {typeof meta.total === 'number' ? ` - ${meta.total} total records` : ''}
      </Text>

      {hasMore && onLoadMore ? (
        <SecondaryButton
          title={loading ? 'Loading...' : 'Load more'}
          onPress={onLoadMore}
          disabled={loading}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  caption: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
});
