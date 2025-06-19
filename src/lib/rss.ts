import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

interface CustomItem extends Parser.Item {
  author?: string;
  description?: string;
}

const parser = new Parser({
  customFields: {
    item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail']],
  },
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    timeout: 30000, // 30 seconds
  },
});

export async function fetchAndParseFeed(feedUrl: string) {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 1000; // 1 second

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return feed;
    } catch (error: any) {
      console.error(`Error fetching or parsing feed ${feedUrl} (attempt ${i + 1}/${MAX_RETRIES}):`, error.message);

      if (i < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, i);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to fetch or parse feed after ${MAX_RETRIES} attempts: ${feedUrl}. Last error: ${error.message}`);
      }
    }
  }
  // This line should ideally not be reached, but for type safety:
  throw new Error('Unexpected error: Maximum retries reached without successful parsing.');
}

export async function saveArticlesFromFeed(feedId: string, feedData: Parser.Output<any>) {
  const articlesToCreate = feedData.items.map((item: CustomItem) => ({
    title: item.title || 'No Title',
    link: item.link || '',
    pubDate: item.pubDate ? new Date(item.pubDate) : null,
    author: item.author || null,
    content: item.content || item.summary || item.description || null,
    feedId: feedId,
  }));

  for (const articleData of articlesToCreate) {
    try {
      await prisma.article.upsert({
        where: { link: articleData.link },
        update: {
          title: articleData.title,
          pubDate: articleData.pubDate,
          author: articleData.author,
          content: articleData.content,
        },
        create: articleData,
      });
    } catch (error) {
      // This error could be due to a duplicate link if upsert fails for some reason
      // or other database related issues for a specific article.
      console.warn(`Could not save article ${articleData.link}:`, error);
    }
  }
} 