import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T = any>(url: string, dependencies: any[] = []): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | string | null>(null);

  const fetchData = useCallback(async () => {
    if (url === "") {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url);
      setData(response.data.data || response.data);
    } catch (err: any) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

export default useFetch;
