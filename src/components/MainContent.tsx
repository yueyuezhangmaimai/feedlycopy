'use client';

import React, { useState, useEffect } from 'react';

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  author: string | null;
  content: string | null;
  feedId: string;
  read: boolean;
  feed: {
    id: string;
    title: string;
    url: string;
  };
}

interface Feed {
  id: string;
  title: string;
  url: string;
}

export default function MainContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedId, setSelectedFeedId] = useState('');
  const [readStatusFilter, setReadStatusFilter] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [searchTerm, selectedFeedId, readStatusFilter]);

  useEffect(() => {
    const fetchFeedsForFilter = async () => {
      try {
        const response = await fetch('/api/feeds');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setFeeds(data);
      } catch (err: any) {
        console.error('Failed to fetch feeds for filter:', err);
      }
    };
    fetchFeedsForFilter();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      if (selectedFeedId) {
        queryParams.append('feedId', selectedFeedId);
      }
      if (readStatusFilter !== 'all') {
        queryParams.append('readStatus', readStatusFilter === 'read' ? 'true' : 'false');
      }

      const url = `/api/articles?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setArticles(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFeedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFeedId(e.target.value);
  };

  const handleReadStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReadStatusFilter(e.target.value);
  };

  const handleToggleReadStatus = async (articleId: string, currentReadStatus: boolean) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: !currentReadStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      fetchArticles(); // Re-fetch articles to update UI
    } catch (err: any) {
      console.error(`Failed to update read status for article ${articleId}:`, err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">最新文章</h2>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="搜索文章标题或内容..."
          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedFeedId}
          onChange={handleFeedFilterChange}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有订阅源</option>
          {feeds.map((feed) => (
            <option key={feed.id} value={feed.id}>
              {feed.title || feed.url}
            </option>
          ))}
        </select>
        <select
          value={readStatusFilter}
          onChange={handleReadStatusFilterChange}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有状态</option>
          <option value="unread">未读</option>
          <option value="read">已读</option>
        </select>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">加载文章...</p>}
      {!loading && articles.length === 0 && <p className="text-gray-600 dark:text-gray-400">暂无文章。请添加订阅源或调整筛选条件。</p>}

      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer ${article.read ? 'opacity-50' : ''}`}
            onClick={() => handleToggleReadStatus(article.id, article.read)}
          >
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {article.title}
              </a>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : ''} - {''}
              <span className="font-medium">{article.feed.title || article.feed.url}</span>
              {article.author && <span className="ml-2">by {article.author}</span>}
            </p>
            <div className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
              {article.content && <div dangerouslySetInnerHTML={{ __html: article.content }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 