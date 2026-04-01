import React from 'react';
import type { Article } from '../../types';
import './Reader.css';
import { useTranslation } from "react-i18next"

interface ReaderProps {
  article: Article | null;
  feedName: string;
  onToggleRead: (articleId: number) => void;
  onBack?: () => void;
}

const Reader: React.FC<ReaderProps> = ({ article, feedName, onToggleRead, onBack }) => {
  const { t } = useTranslation()
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(t('locale'), { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };


  const escHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  if (!article) {
    return (
      <div className="reader">
        <div className="reader-empty">
          <svg 
            className="reader-empty-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <div className="reader-empty-text">{t("select_article")}</div>
          <div className="reader-empty-sub">{t("choose_to_read")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="reader">
      <div className="reader-pane">
        <div className="reader-topbar">
          {onBack && (
            <button className="reader-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <button
            className="reader-topbar-btn"
            onClick={() => onToggleRead(article.id)}
          >
            {article.read ? t('mark_unread') : t('mark_read')}
          </button>
          
          {article.url && (
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button className="reader-topbar-btn">
                {t("open_original")} ↗
              </button>
            </a>
          )}
          
          <div className="reader-topbar-spacer"></div>
        </div>
        
        <div className="reader-content">
          <div className="reader-feed-tag">
            <span>{feedName}</span>
          </div>
          
          <h1 className="reader-title">
            {article.title || 'Untitled'}
          </h1>
          
          <div className="reader-meta">
            {article.published && (
              <>
                <span>{formatDate(article.published)}</span>
                <div className="reader-meta-sep"></div>
              </>
            )}
            {article.author && <span>{escHtml(article.author)}</span>}
          </div>
          
          <div 
            className="reader-body"
            dangerouslySetInnerHTML={{ 
              __html: article.content || article.description || article.summary || 
                '<p style="color:var(--ink-3)">No content available. Open the original article to read more.</p>' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Reader;
