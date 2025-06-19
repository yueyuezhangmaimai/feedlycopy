import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchAndParseFeed, saveArticlesFromFeed } from '@/lib/rss';
import * as cheerio from 'cheerio';

async function discoverRssUrls(pageUrl: string): Promise<string[]> {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const rssLinks: string[] = [];
    $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, el) => {
      let href = $(el).attr('href');
      if (href) {
        href = new URL(href, pageUrl).href;
        rssLinks.push(href);
      }
    });
    return rssLinks;
  } catch (e) {
    return [];
  }
}

function isRssUrl(url: string): boolean {
  return /\.(xml|rss|atom)$/i.test(url) || url.includes('feed');
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 检查是否已存在相同的URL
    const existingFeed = await prisma.feed.findUnique({
      where: { url },
    });

    if (existingFeed) {
      return NextResponse.json({ error: 'Feed already exists' }, { status: 400 });
    }

    // 尝试获取和解析RSS源
    try {
      const feedData = await fetchAndParseFeed(url);
      
      // 创建新的订阅源
      const feed = await prisma.feed.create({
        data: {
          url,
          title: feedData.title || 'Untitled Feed',
          description: feedData.description || null,
          link: feedData.link || null,
          status: 'active',
          lastFetched: new Date(),
        },
      });

      // 创建文章记录
      const articles = feedData.items.map(item => ({
        title: item.title || 'Untitled Article',
        link: item.link || url,
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        content: item.content || '',
        feedId: feed.id,
      }));

      await prisma.article.createMany({
        data: articles,
        skipDuplicates: true,
      });

      // 更新文章计数
      const updatedFeed = await prisma.feed.update({
        where: { id: feed.id },
        data: {
          articleCount: articles.length,
        },
        include: {
          _count: {
            select: {
              articles: true,
            },
          },
        },
      });

      return NextResponse.json({
        ...updatedFeed,
        articleCount: updatedFeed._count.articles,
      });
    } catch (error) {
      // 如果获取或解析失败，创建一个状态为error的订阅源
      const feed = await prisma.feed.create({
        data: {
          url,
          status: 'error',
        },
      });

      return NextResponse.json({
        ...feed,
        articleCount: 0,
      });
    }
  } catch (error: any) {
    console.error('Error adding feed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const feeds = await prisma.feed.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    // 转换数据以包含文章计数
    const feedsWithCount = feeds.map(feed => ({
      ...feed,
      articleCount: feed._count.articles,
    }));

    return NextResponse.json(feedsWithCount);
  } catch (error: any) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 