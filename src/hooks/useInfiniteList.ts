import { useState, useCallback, useRef } from 'react';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseInfiniteListResult<T> {
  items: T[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Generic hook for infinite scroll lists.
 * @param fetchFn - function that accepts a page number and returns a paginated response
 * @param deps - list of values that, when changed, reset the list back to page 1
 */
export function useInfiniteList<T>(
  fetchFn: (page: number) => Promise<PaginatedResponse<T>>,
  deps: readonly unknown[] = [],
): UseInfiniteListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  // Stable ref to fetchFn so callbacks don't stale-close over old version
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const loadPage = useCallback(async (page: number, reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetchFnRef.current(page);
      setItems(prev => reset ? res.data : [...prev, ...res.data]);
      setTotal(res.total);
      setHasMore(page < res.totalPages);
      pageRef.current = page;
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      if (reset) setLoading(false);
      else setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Reset and reload when deps change
  const depsKey = JSON.stringify(deps);
  const lastDepsKey = useRef<string | null>(null);
  if (lastDepsKey.current !== depsKey) {
    lastDepsKey.current = depsKey;
    // Trigger load synchronously-safe via state scheduling
    Promise.resolve().then(() => loadPage(1, true));
  }

  const refresh = useCallback(() => {
    loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || isFetchingRef.current) return;
    loadPage(pageRef.current + 1, false);
  }, [hasMore, loadPage]);

  return { items, total, loading, loadingMore, hasMore, error, refresh, loadMore };
}
