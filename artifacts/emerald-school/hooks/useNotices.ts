/**
 * useNotices — app-level wrapper around the generated React Query notices hooks.
 *
 * Design decisions:
 *  - `isRead` is kept local-only (AsyncStorage) so that one user reading a notice
 *    does not mark it read for every other user. The backend `isRead` column is
 *    reserved for future per-user reads table migration.
 *  - `time` is a display-only derived string built from `postedAt` at render time.
 *  - The query key is `/api/notices` (matches orval's generated key) so manual
 *    invalidation after createNotice hits the same cache entry.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import {
  getListNoticesQueryKey,
  useCreateNotice,
  useListNotices,
} from "@workspace/api-client-react";
import type { Notice } from "@workspace/api-client-react";

// ─── Re-export the Notice type so consumers don't need to import from the lib ──
export type { Notice };

// ─── AsyncStorage key ─────────────────────────────────────────────────────────
const READ_NOTICES_KEY = "@emerald_read_notice_ids";

// ─── Derive a human-readable time string from an ISO date-time ───────────────
export function formatNoticeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const timeStr = `${h % 12 || 12}:${m} ${ampm}`;

  if (isToday) return `Today · ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday · ${timeStr}`;

  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${timeStr}`;
}

// ─── useNotices ───────────────────────────────────────────────────────────────
/**
 * Returns the notices list from the API with local `isRead` overlay applied.
 * Notices that have been read locally are marked `isRead: true` regardless of
 * the server value.
 */
export function useNotices() {
  const readIds = useRef<Set<string>>(new Set());

  // Load persisted read IDs from AsyncStorage once on mount
  useEffect(() => {
    AsyncStorage.getItem(READ_NOTICES_KEY).then((s) => {
      if (s) {
        try {
          readIds.current = new Set(JSON.parse(s) as string[]);
        } catch {}
      }
    });
  }, []);

  const { data, isLoading, isError, error, refetch } = useListNotices();

  // Apply local isRead overlay and attach derived `time` string
  const notices = (data ?? []).map((n) => ({
    ...n,
    isRead: readIds.current.has(n.id) || n.isRead,
    // `time` is not stored in the DB — derive it from postedAt for display
    time: formatNoticeTime(n.postedAt),
  }));

  return { notices, isLoading, isError, error, refetch };
}

// ─── useMarkNoticeReadLocally ─────────────────────────────────────────────────
/**
 * Marks a notice as read in AsyncStorage and updates the React Query cache
 * optimistically so the UI updates without a refetch.
 */
export function useMarkNoticeReadLocally() {
  const queryClient = useQueryClient();
  const readIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(READ_NOTICES_KEY).then((s) => {
      if (s) {
        try {
          readIds.current = new Set(JSON.parse(s) as string[]);
        } catch {}
      }
    });
  }, []);

  return useCallback(
    (id: string) => {
      readIds.current.add(id);
      AsyncStorage.setItem(
        READ_NOTICES_KEY,
        JSON.stringify([...readIds.current])
      );
      // Optimistically update the cache so the UI reflects the change immediately
      queryClient.setQueryData<Notice[]>(
        getListNoticesQueryKey(),
        (old) =>
          old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? old
      );
    },
    [queryClient]
  );
}

// ─── usePostNotice ────────────────────────────────────────────────────────────
/**
 * Mutation hook for creating a notice. Invalidates the notices query on success
 * so the list refetches automatically.
 */
export function usePostNotice() {
  const queryClient = useQueryClient();

  return useCreateNotice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
      },
    },
  });
}
