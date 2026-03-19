import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import ArticlePanel from "./components/ArticlePanel/ArticlePanel";
import Reader from "./components/Reader/Reader";
import MediaPanel from "./components/MediaPanel/MediaPanel";
import { extractMediaFromArticle } from "./components/MasonryGrid/MasonryGrid";
import type { MediaItem } from "./components/MasonryGrid/MasonryGrid";
import MediaPreview from "./components/MediaPanel/MediaPreview";
import AddFeedModal from "./components/Modal/AddFeedModal";
import AddGroupModal from "./components/Modal/AddGroupModal";
import ContextMenu from "./components/ContextMenu/ContextMenu";
import Toast from "./components/Toast/Toast";
import Settings from "./components/Setting/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
import type { AppState, Feed, Group, Article, FeedStats } from "./types";
import { api } from "./api";
import "./styles/global.css";
import { useTranslation } from "react-i18next";

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

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "feed" | "group";
    data: Feed | Group;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({
    message: "",
    show: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [state.filter, state.currentView, state.currentTitle]);

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
      const feedId =
        state.currentView === "feed" && state.currentFeedId
          ? state.currentFeedId
          : undefined;
      const unreadOnly =
        state.filter === "unread" || state.currentView === "unread";
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
      updateBadges();
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

  const updateBadges = (): void => {
    // Badges are calculated in Sidebar component
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2800);
  };

  const selectView = (
    type: "all" | "unread" | "feed" | "group" | "media",
    title: string,
    feedId?: number,
    groupId?: number,
  ) => {
    setState((s) => ({
      ...s,
      currentView: type,
      currentFeedId: feedId || null,
      currentGroupId: groupId || null,
      currentTitle: title,
      currentArticle: null,
    }));
  };


  const toggleGroup = (groupId: number) => {
    setState((s) => ({
      ...s,
      groupExpanded: {
        ...s.groupExpanded,
        [groupId]: s.groupExpanded[groupId] === false ? true : false,
      },
    }));
  };

  const openArticle = async (article: Article) => {
    setState((s) => ({ ...s, currentArticle: article }));

    if (!article.read) {
      try {
        await api.articles.markRead(article.id, true);
        setState((s) => ({
          ...s,
          articles: s.articles.map((a) =>
            a.id === article.id ? { ...a, read: true } : a,
          ),
        }));
        await loadStats();
      } catch (e) {
        console.error("Failed to mark article as read", e);
      }
    }
  };

  const toggleRead = async (articleId: number) => {
    const article = state.articles.find((a) => a.id === articleId);
    if (!article) return;

    const newReadState = !article.read;
    try {
      await api.articles.markRead(articleId, newReadState);
      setState((s) => ({
        ...s,
        articles: s.articles.map((a) =>
          a.id === articleId ? { ...a, read: newReadState } : a,
        ),
        currentArticle:
          s.currentArticle?.id === articleId
            ? { ...s.currentArticle, read: newReadState }
            : s.currentArticle,
      }));
      await loadStats();
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  };

  const refreshFeed = async (feedId: number) => {
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
  };

  const markFeedRead = async (feedId: number) => {
    try {
      await api.feeds.markAllRead(feedId, true);
      await loadStats();
      await loadArticles();
      showToast(t("mark_all_as_read"));
    } catch (e) {
      showToast(t("failed"));
      console.error(e);
    }
  };

  const deleteFeed = async (feedId: number) => {
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
  };

  const deleteGroup = async (groupId: number) => {
    if (!window.confirm(t("delete_this_group")))
      return;
    try {
      await api.groups.delete(groupId);
      await loadGroups();
      await loadFeeds();
      showToast(t("group_deleted"));
    } catch (e) {
      showToast(t("delete_failed"));
      console.error(e);
    }
  };

  const toggleGroupMedia = async (groupId: number, currentIsMedia: boolean) => {
    try {
      await api.groups.updateMedia(groupId, !currentIsMedia);
      await loadGroups();
      showToast(!currentIsMedia ? t("group_marked_media") : t("group_unmarked_media"));
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  };

  const moveFeedToGroup = async (feedId: number, groupId: number | null) => {
    try {
      await api.feeds.updateGroup(feedId, groupId || undefined);
      await loadFeeds();
      const groupName = groupId ? state.groups.find(g => g.id === groupId)?.name : null;
      showToast(groupName ? t("feed_moved_to") + `: ${groupName}` : t("feed_removed_from_group"));
    } catch (e) {
      showToast(t("update_failed"));
      console.error(e);
    }
  };

  const refreshCurrentFeed = async () => {
    if (state.currentView === "feed" && state.currentFeedId) {
      await refreshFeed(state.currentFeedId);
    } else {
      showToast(t("refreshing_all_feed"));
      try {
        await Promise.all(
          state.feeds.map((f) => api.feeds.update(f.id).catch(() => { })),
        );
        await loadStats();
        await loadArticles();
        showToast(t("all_feeds_refreshed"));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const markAllCurrentRead = async () => {
    try {
      const feedId =
        state.currentView === "feed" && state.currentFeedId
          ? state.currentFeedId
          : undefined;
      await api.feeds.markAllRead(feedId, true);
      await loadStats();
      await loadArticles();
      showToast(t("mark_all_as_read"));
    } catch (e) {
      showToast(t("failed"));
      console.error(e);
    }
  };

  const handleAddFeed = async (url: string, groupId?: number) => {
    setShowFeedModal(false);
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
  };

  const handleAddGroup = async (name: string) => {
    setShowGroupModal(false);
    try {
      await api.groups.create(name);
      await loadGroups();
      showToast(t("group_created") + `:${name}`);
    } catch (e) {
      showToast(t("failed_to_create_group"));
      console.error(e);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: "feed" | "group",
    data: Feed | Group,
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, data });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const mediaItems = useMemo(() => {
    if (state.currentView !== 'media' || !state.currentGroupId) return [];

    const groupFeeds = state.feeds.filter(f => f.group_id === state.currentGroupId);
    const feedIds = new Set(groupFeeds.map(f => f.id));

    const items: MediaItem[] = [];
    state.articles
      .filter(a => feedIds.has(a.feed_id))
      .forEach(article => {
        const media = extractMediaFromArticle(article);
        media.forEach(m => {
          items.push({ ...m, articleId: article.id });
        });
      });

    return items;
  }, [state.currentView, state.currentGroupId, state.feeds, state.articles]);

  return (
    <ThemeProvider>
      <Sidebar
        feeds={state.feeds}
        groups={state.groups}
        feedStats={state.feedStats}
        currentView={state.currentView}
        currentFeedId={state.currentFeedId}
        currentGroupId={state.currentGroupId}
        groupExpanded={state.groupExpanded}
        onSelectView={selectView}
        onToggleGroup={toggleGroup}
        onAddFeed={() => setShowFeedModal(true)}
        onAddGroup={() => setShowGroupModal(true)}
        onContextMenu={handleContextMenu}
        onSettings={() => setShowSettings(true)}
      />

      {state.currentView === 'media' ? (
        <MediaPanel
          title={state.currentTitle}
          items={mediaItems}
          onRefresh={refreshCurrentFeed}
          onItemClick={(item) => setPreviewItem(item)}
        />
      ) : (
        <>
          <ArticlePanel
            title={state.currentTitle}
            articles={state.articles}
            currentArticleId={state.currentArticle?.id}
            onOpenArticle={openArticle}
            onRefresh={refreshCurrentFeed}
            onMarkAllRead={markAllCurrentRead}
          />

          <Reader
            article={state.currentArticle}
            feedName={
              state.currentArticle
                ? state.feeds.find((f) => f.id === state.currentArticle!.feed_id)
                  ?.title || ""
                : ""
            }
            onToggleRead={toggleRead}
          />
        </>
      )}

      {showFeedModal && (
        <AddFeedModal
          groups={state.groups}
          onClose={() => setShowFeedModal(false)}
          onSubmit={handleAddFeed}
        />
      )}

      {showGroupModal && (
        <AddGroupModal
          onClose={() => setShowGroupModal(false)}
          onSubmit={handleAddGroup}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          data={contextMenu.data}
          groups={state.groups}
          onClose={closeContextMenu}
          onRefresh={
            contextMenu.type === "feed"
              ? () => refreshFeed((contextMenu.data as Feed).id)
              : undefined
          }
          onMarkAllRead={
            contextMenu.type === "feed"
              ? () => markFeedRead((contextMenu.data as Feed).id)
              : undefined
          }
          onToggleMedia={
            contextMenu.type === "group"
              ? () => toggleGroupMedia((contextMenu.data as Group).id, (contextMenu.data as Group).is_media)
              : undefined
          }
          onMoveToGroup={
            contextMenu.type === "feed"
              ? (groupId) => moveFeedToGroup((contextMenu.data as Feed).id, groupId)
              : undefined
          }
          onDelete={
            contextMenu.type === "feed"
              ? () => deleteFeed((contextMenu.data as Feed).id)
              : () => deleteGroup((contextMenu.data as Group).id)
          }
        />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      {previewItem && (
        <MediaPreview
          src={previewItem.src}
          type={previewItem.type}
          title={previewItem.title || state.articles.find(a => a.id === previewItem.articleId)?.title}
          onClose={() => setPreviewItem(null)}
        />
      )}

      <Toast message={toast.message} show={toast.show} />
    </ThemeProvider>
  );
}

export default App;
