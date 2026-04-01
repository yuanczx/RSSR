import React from 'react';
import type { Article } from '../../types';
import './ArticlePanel.css';
import { useTranslation } from "react-i18next"

interface ArticlePanelProps {
  title: string;
  articles: Article[];
  currentArticleId?: number;
  onOpenArticle: (article: Article) => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onBack?: () => void;
}

const ArticlePanel: React.FC<ArticlePanelProps> = ({
  title,
  articles,
  currentArticleId,
  onOpenArticle,
  onRefresh,
  onMarkAllRead,
  onBack,
}) => {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
      if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };
  const { t } = useTranslation()

  const escHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  return (
    <div className="panel">
      <div className='panel-top'>
        <div className="panel-header">
          {onBack && (
            <button className="panel-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <div className="panel-title">{title}</div>
          <div className="panel-meta">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className='panel-toolbar'>

          <button
            className="toolbar-btn"
            onClick={onMarkAllRead}
            title="Mark all as read">
            {t("mark_read")}
          </button>
          <button
            className="toolbar-btn"
            onClick={onRefresh}
            title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="article-list">
        {articles.length === 0 ? (
          <div className="empty-state">
            {t("no_articles")}
          </div>
        ) : (
          articles.map(article => (
            <div
              key={article.id}
              className={`article-item ${article.read ? '' : 'unread'} ${currentArticleId === article.id ? 'active' : ''}`}
              onClick={() => onOpenArticle(article)}
            >
              <div className="article-item-header">
                <div className="unread-dot"></div>
                <span className="article-feed-name">
                  {article.author || t("unknown author")}
                </span>
                <span className="article-date">
                  {formatDate(article.published)}
                </span>
              </div>
              <div 
                className="article-item-title"
                dangerouslySetInnerHTML={{ __html: escHtml(article.title || 'Untitled') }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArticlePanel;
