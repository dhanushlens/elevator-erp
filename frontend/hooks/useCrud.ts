"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListResponse } from "@/types";

export function useList<T>(resource: string, extraParams: Record<string, string | number | undefined> = {}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const query = useQuery<ListResponse<T>>({
    queryKey: [resource, page, search, extraParams],
    queryFn: async () =>
      (
        await api.get(`/${resource}`, {
          params: { page, limit: 20, ...(search ? { search } : {}), ...extraParams },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    rows: query.data?.data || [],
    page,
    pages: query.data?.pages || 1,
    total: query.data?.total || 0,
    setPage,
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(1);
    },
  };
}

export function useItem<T>(resource: string, id?: string, suffix = "") {
  return useQuery<T>({
    queryKey: [resource, id, suffix],
    queryFn: async () => (await api.get(`/${resource}/${id}${suffix}`)).data.data,
    enabled: !!id,
  });
}

export function useCrudMutations(resource: string, invalidate?: string[]) {
  const queryClient = useQueryClient();
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [resource] });
    (invalidate || []).forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post(`/${resource}`, payload)).data.data,
    onSuccess: invalidateAll,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) =>
      (await api.patch(`/${resource}/${id}`, payload)).data.data,
    onSuccess: invalidateAll,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/${resource}/${id}`)).data,
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
