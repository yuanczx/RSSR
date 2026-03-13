export interface Feed {
  id: number;
  url: string;
  title?: string;
  group_id?: number;
  last_fetched?: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  created_at: string;
}

export interface Article {
  id: number;
  feed_id: number;
  title: string;
  content?: string;
  summary?: string;
  url?: string;
  author?: string;
  read: boolean;
  published_at: string;
}

export interface FeedStats {
  id: number;
  unread_count: number;
  total_count: number;
}

export interface AppState {
  feeds: Feed[];
  groups: Group[];
  articles: Article[];
  feedStats: Record<number, FeedStats>;
  currentView: 'all' | 'unread' | 'feed';
  currentFeedId: number | null;
  currentGroupId: number | null;
  currentTitle: string;
  currentArticle: Article | null;
  filter: 'all' | 'unread';
  groupExpanded: Record<number, boolean>;
}

export type ViewType = 'all' | 'unread' | 'feed';