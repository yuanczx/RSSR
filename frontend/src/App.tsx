import React, { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import ArticlePanel from "./components/ArticlePanel/ArticlePanel";
import Reader from "./components/Reader/Reader";
import MediaPanel from "./components/MediaPanel/MediaPanel";
import MediaPreview from "./components/MediaPanel/MediaPreview";
import AddFeedModal from "./components/Modal/AddFeedModal";
import AddGroupModal from "./components/Modal/AddGroupModal";
import ContextMenu from "./components/ContextMenu/ContextMenu";
import Toast from "./components/Toast/Toast";
import Settings from "./components/Setting/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAppState } from "./hooks/useAppState";
import type { Feed, Group } from "./types";
import type { MediaItem } from "./components/MasonryGrid/MasonryGrid";
import "./styles/global.css";

function App() {
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "feed" | "group";
    data: Feed | Group;
  } | null>(null);

  const {
    state,
    toast,
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
  } = useAppState();

  const handleContextMenu = (e: React.MouseEvent, type: "feed" | "group", data: Feed | Group) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, data });
  };

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
          onItemClick={setPreviewItem}
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
            feedName={getFeedName(state.currentArticle)}
            onToggleRead={toggleRead}
          />
        </>
      )}

      {showFeedModal && (
        <AddFeedModal
          groups={state.groups}
          onClose={() => setShowFeedModal(false)}
          onSubmit={addFeed}
        />
      )}

      {showGroupModal && (
        <AddGroupModal
          onClose={() => setShowGroupModal(false)}
          onSubmit={addGroup}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          data={contextMenu.data}
          groups={state.groups}
          onClose={() => setContextMenu(null)}
          onRefresh={contextMenu.type === "feed" ? () => refreshFeed((contextMenu.data as Feed).id) : undefined}
          onMarkAllRead={contextMenu.type === "feed" ? () => markFeedRead((contextMenu.data as Feed).id) : undefined}
          onToggleMedia={contextMenu.type === "group" ? () => toggleGroupMedia((contextMenu.data as Group).id, (contextMenu.data as Group).is_media) : undefined}
          onMoveToGroup={contextMenu.type === "feed" ? (groupId) => moveFeedToGroup((contextMenu.data as Feed).id, groupId) : undefined}
          onDelete={contextMenu.type === "feed" ? () => deleteFeed((contextMenu.data as Feed).id) : () => deleteGroup((contextMenu.data as Group).id)}
        />
      )}

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

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
