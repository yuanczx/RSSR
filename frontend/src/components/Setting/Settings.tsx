import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (language: 'en_US' | 'zh_CN') => {
    i18n.changeLanguage(language);
  };

  const handleFontSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    setFontSize(newSize);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h1 className="settings-title">{t('settings')}</h1>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Appearance Section */}
          <div className="settings-section">
            <h2 className="section-title">{t('appearance')}</h2>
            
            <div className="settings-item">
              <label className="item-label">{t('theme')}</label>
              <div className="theme-options">
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  ☀ {t('light')}
                </button>
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  ☾ {t('dark')}
                </button>
              </div>
            </div>

            <div className="settings-item">
              <label className="item-label">{t('font_size')}</label>
              <div className="font-size-options">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button 
                    key={size}
                    className={`font-size-btn ${fontSize === size ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange(size)}
                  >
                    {t(size)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div className="settings-section">
            <h2 className="section-title">{t('language')}</h2>
            
            <div className="settings-item">
              <label className="item-label">{t('select_language')}</label>
              <div className="language-options">
                {(['en_US', 'zh_CN'] as const).map(lang => (
                  <button 
                    key={lang}
                    className={`language-btn ${i18n.language === lang ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang === 'en_US' ? 'English' : '中文'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reading Section */}
          {/* <div className="settings-section"> */}
            {/* <h2 className="section-title">{t('reading')}</h2> */}
            
            {/* <div className="settings-item">
              <div className="toggle-row">
                <label className="item-label">{t('auto_refresh')}</label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.autoRefresh}
                    onChange={e => handleAutoRefreshChange(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {settings.autoRefresh && (
                <div className="refresh-interval">
                  <label className="interval-label">{t('refresh_interval')} ({settings.refreshInterval}m)</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    step="5"
                    value={settings.refreshInterval}
                    onChange={handleRefreshIntervalChange}
                    className="interval-slider"
                  />
                </div>
              )}
            </div> */}

            {/* <div className="settings-item">
              <div className="toggle-row">
                <label className="item-label">{t('show_read_articles')}</label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.showReadArticles}
                    onChange={e => handleShowReadArticlesChange(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div> */}
          {/* </div> */}
        </div>

      </div>
    </div>
  );
};

export default Settings;