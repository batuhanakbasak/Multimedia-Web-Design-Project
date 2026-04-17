import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_PAGE_SIZE } from '../constants/api';
import type { ApiMeta } from '../types/api';

export const usePagination = (initialLimit = DEFAULT_PAGE_SIZE) => {
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: initialLimit,
    total: 0,
    total_pages: 0,
  });

  const resetPagination = useCallback(() => {
    setMeta((previous) => ({
      ...previous,
      page: 1,
      total: 0,
      total_pages: 0,
    }));
  }, []);

  const syncMeta = useCallback((nextMeta?: ApiMeta) => {
    setMeta((previous) => ({
      ...previous,
      ...nextMeta,
      page: nextMeta?.page ?? previous.page ?? 1,
      limit: nextMeta?.limit ?? previous.limit ?? initialLimit,
      total: nextMeta?.total ?? previous.total ?? 0,
      total_pages: nextMeta?.total_pages ?? previous.total_pages ?? 0,
    }));
  }, [initialLimit]);

  const nextPage = useCallback(() => {
    setMeta((previous) => ({
      ...previous,
      page: (previous.page || 1) + 1,
    }));
  }, []);

  const page = meta.page ?? 1;
  const limit = meta.limit ?? initialLimit;

  const hasMore = useMemo(() => {
    if (!meta.total_pages) {
      return false;
    }

    return page < meta.total_pages;
  }, [meta.total_pages, page]);

  return {
    meta,
    page,
    limit,
    hasMore,
    nextPage,
    syncMeta,
    resetPagination,
  };
};
