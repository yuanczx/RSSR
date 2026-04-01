import React, { useState, useEffect } from "react";
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
import type { Feed, Group, Article, ViewType } from "./types";
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
  const [mobileView, setMobileView] = useState<"sidebar" | "panel" | "reader">("sidebar");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Mobile view handling
  const handleSelectView = (view: ViewType, title: string, feedId?: number, groupId?: number) => {
    selectView(view, title, feedId, groupId);
    if (isMobile) {
      setMobileView("panel");
    }
  };

  const handleOpenArticle = (article: Article) => {
    openArticle(article);
    if (isMobile) {
      setMobileView("reader");
    }
  };

  const handleBackToPanel = () => setMobileView("panel");
  const handleBackToSidebar = () => setMobileView("sidebar");

  const renderSidebar = () => (
    <Sidebar
      feeds={state.feeds}
      groups={state.groups}
      feedStats={state.feedStats}
      currentView={state.currentView}
      currentFeedId={state.currentFeedId}
      currentGroupId={state.currentGroupId}
      groupExpanded={state.groupExpanded}
      onSelectView={handleSelectView}
      onToggleGroup={toggleGroup}
      onAddFeed={() => setShowFeedModal(true)}
      onAddGroup={() => setShowGroupModal(true)}
      onContextMenu={handleContextMenu}
      onSettings={() => setShowSettings(true)}
    />
  );

  const renderArticlePanel = () => (
    <ArticlePanel
      title={state.currentTitle}
      articles={state.articles}
      currentArticleId={state.currentArticle?.id}
      onOpenArticle={handleOpenArticle}
      onRefresh={refreshCurrentFeed}
      onMarkAllRead={markAllCurrentRead}
      onBack={isMobile ? handleBackToSidebar : undefined}
    />
  );

  const renderReader = () => (
    <Reader
      article={state.currentArticle}
      feedName={getFeedName(state.currentArticle)}
      onToggleRead={toggleRead}
      onBack={isMobile ? handleBackToPanel : undefined}
    />
  );

  const renderMediaPanel = () => (
    <MediaPanel
      title={state.currentTitle}
      items={mediaItems}
      onRefresh={refreshCurrentFeed}
      onItemClick={setPreviewItem}
      onBack={isMobile ? handleBackToSidebar : undefined}
    />
  );

  // Mobile layout
  if (isMobile) {
    return (
      <ThemeProvider>
        <div className="mobile-container">
          {mobileView === "sidebar" && <div className="mobile-view">{renderSidebar()}</div>}
          {mobileView === "panel" && (
            state.currentView === "media"
              ? <div className="mobile-view">{renderMediaPanel()}</div>
              : <div className="mobile-view">{renderArticlePanel()}</div>
          )}
          {mobileView === "reader" && <div className="mobile-view">{renderReader()}</div>}
        </div>

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

  // Desktop layout
  return (
    <ThemeProvider>
      {renderSidebar()}

      {state.currentView === "media" ? (
        renderMediaPanel()
      ) : (
        <>
          {renderArticlePanel()}
          {renderReader()}
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