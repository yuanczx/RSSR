import React from 'react';
import type { Feed, Group, FeedStats } from '../../types';
import './Sidebar.css';
import { useTranslation } from "react-i18next";

interface SidebarProps {
  feeds: Feed[];
  groups: Group[];
  feedStats: Record<number, FeedStats>;
  currentView: 'all' | 'unread' | 'feed';
  currentFeedId: number | null;
  groupExpanded: Record<number, boolean>;
  onSelectView: (type: 'all' | 'unread' | 'feed', title: string, feedId?: number) => void;
  onToggleGroup: (groupId: number) => void;
  onAddFeed: () => void;
  onAddGroup: () => void;
  onContextMenu: (e: React.MouseEvent, type: 'feed' | 'group', data: Feed | Group) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  feeds,
  groups,
  feedStats,
  currentView,
  currentFeedId,
  groupExpanded,
  onSelectView,
  onToggleGroup,
  onAddFeed,
  onAddGroup,
  onContextMenu,
}) => {
  const { t } = useTranslation()
  const totalUnread = Object.values(feedStats).reduce((sum, stats) => sum + (stats.unread_count || 0), 0);
  const getFeedUnreadCount = (feedId: number) => {
    return feedStats[feedId]?.unread_count || 0;
  };

  const groupedFeeds: Record<number, Feed[]> = {};
  const ungroupedFeeds: Feed[] = [];

  feeds.forEach(feed => {
    if (feed.group_id) {
      if (!groupedFeeds[feed.group_id]) groupedFeeds[feed.group_id] = [];
      groupedFeeds[feed.group_id].push(feed);
    } else {
      ungroupedFeeds.push(feed);
    }
  });

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">RSS<span>R</span></div>
        <div className="sidebar-subtitle">RSS Reader</div>
      </div>

      <div className="sidebar-actions">
        <button className="btn-ghost" onClick={onAddFeed}>+ {t("add_feed")}</button>
        <button className="btn-ghost" onClick={onAddGroup}>+ {t("new_group")}</button>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">{t("inbox")}</div>
        <div 
          className={`nav-item ${currentView === 'all' && currentFeedId === null ? 'active' : ''}`}
          onClick={() => onSelectView('all', t('all_articles'))}
        >
          <div className="nav-item-icon">
            <svg className="icon" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <span className="nav-item-label">{t("all_articles")}</span>
          {totalUnread > 0 && <span className="nav-badge">{totalUnread}</span>}
        </div>
        
        <div 
          className={`nav-item ${currentView === 'unread' ? 'active' : ''}`}
          onClick={() => onSelectView('unread', t("unread"))}
        >
          <div className="nav-item-icon">
            <svg className="icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 16 14"/>
            </svg>
          </div>
          <span className="nav-item-label">{t("unread")}</span>
          {totalUnread > 0 && <span className="nav-badge">{totalUnread}</span>}
        </div>

        <div className="nav-section-label" style={{ marginTop: '6px' }}>Feeds</div>
        
        {ungroupedFeeds.map(feed => (
          <div
            key={feed.id}
            className={`nav-item ${currentView === 'feed' && currentFeedId === feed.id ? 'active' : ''}`}
            onClick={() => onSelectView('feed', feed.title || feed.url, feed.id)}
            onContextMenu={(e) => onContextMenu(e, 'feed', feed)}
          >
            <div className="nav-item-icon">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M4 11a9 9 0 0 1 9 9"/>
                <path d="M4 4a16 16 0 0 1 16 16"/>
                <circle cx="5" cy="19" r="1" fill="currentColor"/>
              </svg>
            </div>
            <span className="nav-item-label" title={feed.title || feed.url}>
              {feed.title || feed.url}
            </span>
            {getFeedUnreadCount(feed.id) > 0 && (
              <span className="nav-badge">{getFeedUnreadCount(feed.id)}</span>
            )}
          </div>
        ))}

        {groups.map(group => {
          const feedsInGroup = groupedFeeds[group.id] || [];
          const expanded = groupExpanded[group.id] !== false;
          
          return (
            <React.Fragment key={group.id}>
              <div 
                className="group-toggle"
                onClick={() => onToggleGroup(group.id)}
                onContextMenu={(e) => onContextMenu(e, 'group', group)}
              >
                <svg 
                  className={`group-chevron ${expanded ? 'open' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className="group-name">{group.name}</span>
              </div>
              
              <div className="group-container" style={{ display: expanded ? 'block' : 'none' }}>
                {feedsInGroup.map(feed => (
                  <div
                    key={feed.id}
                    className={`nav-item ${currentView === 'feed' && currentFeedId === feed.id ? 'active' : ''}`}
                    onClick={() => onSelectView('feed', feed.title || feed.url, feed.id)}
                    onContextMenu={(e) => onContextMenu(e, 'feed', feed)}
                  >
                    <div className="nav-item-icon">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M4 11a9 9 0 0 1 9 9"/>
                        <path d="M4 4a16 16 0 0 1 16 16"/>
                        <circle cx="5" cy="19" r="1" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="nav-item-label" title={feed.title || feed.url}>
                      {feed.title || feed.url}
                    </span>
                    {getFeedUnreadCount(feed.id) > 0 && (
                      <span className="nav-badge">{getFeedUnreadCount(feed.id)}</span>
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
