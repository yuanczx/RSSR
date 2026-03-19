const API_BASE = "/api";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API error");
  return data.data;
}

export const api = {
  feeds: {
    getAll: () => apiFetch("/feeds"),
    add: (url: string, groupId?: number) =>
      apiFetch("/feeds", {
        method: "POST",
        body: JSON.stringify({ url, group_id: groupId || undefined }),
      }),
    delete: (id: number) => apiFetch(`/feeds/${id}`, { method: "DELETE" }),
    update: (id: number) => apiFetch(`/feeds/${id}/update`, { method: "POST" }),
    updateGroup: (id: number, groupId?: number) =>
      apiFetch(`/feeds/${id}/group`, {
        method: "POST",
        body: JSON.stringify({ group_id: groupId || null }),
      }),
    markAllRead: (feedId?: number, read = true) =>
      apiFetch(`/feeds/${feedId}/${read ? "read" : "unread"}`, {
        method: "POST",
      }),
  },
  groups: {
    getAll: () => apiFetch("/groups"),
    create: (name: string) =>
      apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    delete: (id: number) => apiFetch(`/groups/${id}`, { method: "DELETE" }),
    update: (id: number, name: string) =>
      apiFetch(`/groups/${id}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    updateMedia: (id: number, isMedia: boolean) =>
      apiFetch(`/groups/${id}`, {
        method: "POST",
        body: JSON.stringify({ name: "", is_media: isMedia }),
      }),
  },
  articles: {
    getAll: (feedId?: number, unreadOnly: boolean = false) => {
      const params = new URLSearchParams();
      if (feedId) params.append("feed_id", feedId.toString());
      if (unreadOnly) params.append("unread_only", "true");
      return apiFetch(`/articles?${params}`);
    },
    markRead: (id: number, read = true) =>
      apiFetch(`/articles/${id}/${read ? "read" : "unread"}`, {
        method: "POST",
      }),
  },
  stats: {
    getFeedStats: () => apiFetch("/stats"),
  },
};
