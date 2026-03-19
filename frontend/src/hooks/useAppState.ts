import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../api";
import { useTranslation } from "react-i18next";
import type { AppState, Feed, Group, Article, FeedStats, ViewType } from "../types";
import { extractMediaFromArticle } from "../components/MasonryGrid/MasonryGrid";
import type { MediaItem } from "../components/MasonryGrid/MasonryGrid";

const initialState: AppState = {
  feeds: [],
  groups: [],
  articles: [],
  feedStats: {},
  currentView: "all",
  currentFeedId: null,
  currentGroupId: null,
  currentTitle: "All Articles",
  currentArticle: null,
  filter: "all",
  groupExpanded: {},
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const [toast, setToast] = useState({ message: "", show: false });
  const { t } = useTranslation();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [state.filter, state.currentView, state.currentTitle]);

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2800);
  }, []);

  const init = async () => {
    try {
      setState((s) => ({ ...s, currentTitle: t("all_articles") }));
      await Promise.all([loadFeeds(), loadGroups(), loadStats()]);
      await loadArticles();
    } catch (e) {
      showToast(t("no_api"));
      console.error(e);
    }
  };

  const loadFeeds = async () => {
    const feeds = await api.feeds.getAll();
    setState((s) => ({ ...s, feeds }));
  };

  const loadGroups = async () => {
    const groups = await api.groups.getAll();
    setState((s) => ({ ...s, groups }));
  };

  const loadArticles = async () => {
    try {
      const feedId = state.currentView === "feed" && state.currentFeedId ? state.currentFeedId : undefined;
      const unreadOnly = state.filter === "unread" || state.currentView === "unread";
      const raw = await api.articles.getAll(feedId, unreadOnly);
      const articles = (raw || []).map((a: any) => ({
        ...a,
        id: a.id,
        feed_id: a.feed_id ?? a.feedId,
        title: a.title,
        content: a.content,
        summary: a.summary,
        url: a.url ?? a.link,
        author: a.author,
        read: a.read ?? a.is_read ?? false,
        published_at: a.published_at ?? a.publishedAt ?? a.pub_date,
      }));
      setState((s: AppState) => ({ ...s, articles }));
      loadStats();
    } catch (e) {
      console.error("Failed to load articles", e);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.stats.getFeedStats();
      const feedStats: Record<number, FeedStats> = {};
      (stats || []).forEach((s: any) => {
        feedStats[s.id] = s;
      });
      setState((s) => ({ ...s, feedStats }));
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const selectView = useCallback((type: ViewType, title: string, feedId?: number, groupId?: number) => {
    setState((s) => ({
      ...s,
      currentView: type,
      currentFeedId: feedId || null,
      currentGroupId: groupId || null,
      currentTitle: title,
      currentArticle: null,
    }));
  }, []);

  const toggleGroup = useCallback((groupId: number) => {
    setState((s) => ({
      ...s,
      groupExpanded: {
        ...s.groupExpanded,
        [groupId]: s.groupExpanded[groupId] === false ? true : false,
      },
    }));
  }, []);

  const openArticle = useCallback(async (article: Article) => {
    setState((s) => ({ ...s, currentArticle: article }));

    if (!article.read) {
      try {
        await api.articles.markRead(article.id, true);
        setState((s) => ({
          ...s,
          articles: s.articles.map((a) => a.id === article.id ? { ...a, read: true } : a),
        }));
        loadStats();
      } catch (e) {
        console.error("Failed to mark article as read", e);
      }
    }
  }, []);

  const toggleRead = useCallback(async (articleId: number) => {
    const article = state.articles.find((a) => a.id === articleId);
    if (!article) return;

    const newReadState = !article.read;
    try {
      await api.articles.markRead(articleId, newReadState);
      setState((s) => ({
        ...s,
        articles: s.articles.map((a) => a.id === articleId ? { ...a, read: newReadState } : a),
        currentArticle: s.currentArticle?.id === articleId ? { ...s.currentArticle, read: newReadState } : s.currentArticle,
      }));
      loadStats();
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  }, [state.articles, state.currentArticle, showToast, t]);

  const refreshFeed = useCallback(async (feedId: number) => {
    showToast(t("refreshing"));
    try {
      await api.feeds.update(feedId);
      await loadStats();
      await loadArticles();
      showToast(t("feed_refreshed"));
    } catch (e) {
      showToast(t("refresh_failed"));
      console.error(e);
    }
  }, [showToast, t]);

  const markFeedRead = useCallback(async (feedId: number) => {
    try {
      await api.feeds.markAllRead(feedId, true);
      await loadStats();
      await loadArticles();
      showToast(t("mark_all_as_read"));
    } catch (e) {
      showToast(t("failed"));
      console.error(e);
    }
  }, [showToast, t]);

  const deleteFeed = useCallback(async (feedId: number) => {
    if (!window.confirm(t("delete_this_feed"))) return;
    try {
      await api.feeds.delete(feedId);
      await loadFeeds();
      await loadStats();
      if (state.currentFeedId === feedId) {
        selectView("all", t("all_articles"));
      } else {
        await loadArticles();
      }
      showToast(t("feed_deleted"));
    } catch (e) {
      showToast(t("delete_failed"));
      console.error(e);
    }
  }, [state.currentFeedId, selectView, showToast, t]);

  const deleteGroup = useCallback(async (groupId: number) => {
    if (!window.confirm(t("delete_this_group"))) return;
    try {
      await api.groups.delete(groupId);
      await loadGroups();
      await loadFeeds();
      showToast(t("group_deleted"));
    } catch (e) {
      showToast(t("delete_failed"));
      console.error(e);
    }
  }, [showToast, t]);

  const toggleGroupMedia = useCallback(async (groupId: number, currentIsMedia: boolean) => {
    try {
      await api.groups.updateMedia(groupId, !currentIsMedia);
      await loadGroups();
      showToast(!currentIsMedia ? t("group_marked_media") : t("group_unmarked_media"));
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  }, [showToast, t]);

  const moveFeedToGroup = useCallback(async (feedId: number, groupId: number | null) => {
    try {
      await api.feeds.updateGroup(feedId, groupId || undefined);
      await loadFeeds();
      const groupName = groupId ? state.groups.find(g => g.id === groupId)?.name : null;
      showToast(groupName ? t("feed_moved_to") + `: ${groupName}` : t("feed_removed_from_group"));
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  }, [state.groups, showToast, t]);

  const refreshCurrentFeed = useCallback(async () => {
    if (state.currentView === "feed" && state.currentFeedId) {
      await refreshFeed(state.currentFeedId);
    } else {
      showToast(t("refreshing_all_feed"));
      try {
        await Promise.all(state.feeds.map((f) => api.feeds.update(f.id).catch(() => { })));
        await loadStats();
        await loadArticles();
        showToast(t("all_feeds_refreshed"));
      } catch (e) {
        console.error(e);
      }
    }
  }, [state.currentView, state.currentFeedId, state.feeds, refreshFeed, showToast, t]);

  const markAllCurrentRead = useCallback(async () => {
    try {
      const feedId = state.currentView === "feed" && state.currentFeedId ? state.currentFeedId : undefined;
      await api.feeds.markAllRead(feedId, true);
      await loadStats();
      await loadArticles();
      showToast(t("mark_all_as_read"));
    } catch (e) {
      showToast(t("failed"));
      console.error(e);
    }
  }, [state.currentView, state.currentFeedId, showToast, t]);

  const addFeed = useCallback(async (url: string, groupId?: number) => {
    showToast(t("adding_feed"));
    try {
      await api.feeds.add(url, groupId);
      await loadFeeds();
      await loadStats();
      showToast(t("feed_added"));
    } catch (e) {
      showToast(t("failed_to_add_feed"));
      console.error(e);
    }
  }, [showToast, t]);

  const addGroup = useCallback(async (name: string) => {
    try {
      await api.groups.create(name);
      await loadGroups();
      showToast(t("group_created") + `:${name}`);
    } catch (e) {
      showToast(t("failed_to_create_group"));
      console.error(e);
    }
  }, [showToast, t]);

  const mediaItems = useMemo(() => {
    if (state.currentView !== 'media' || !state.currentGroupId) return [];
    const groupFeeds = state.feeds.filter(f => f.group_id === state.currentGroupId);
    const feedIds = new Set(groupFeeds.map(f => f.id));
    const items: MediaItem[] = [];
    state.articles
      .filter(a => feedIds.has(a.feed_id))
      .forEach(article => {
        extractMediaFromArticle(article).forEach(m => {
          items.push({ ...m, articleId: article.id });
        });
      });
    return items;
  }, [state.currentView, state.currentGroupId, state.feeds, state.articles]);

  const getFeedName = useCallback((article: Article | null) => {
    if (!article) return "";
    return state.feeds.find((f) => f.id === article.feed_id)?.title || "";
  }, [state.feeds]);

  return {
    state,
    toast,
    showToast,
    selectView,
    toggleGroup,
    openArticle,
    toggleRead,
    refreshFeed,
    markFeedRead,
    deleteFeed,
    deleteGroup,
    toggleGroupMedia,
    moveFeedToGroup,
    refreshCurrentFeed,
    markAllCurrentRead,
    addFeed,
    addGroup,
    mediaItems,
    getFeedName,
  };
}
