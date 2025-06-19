import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const feedId = searchParams.get('feedId');
    const readStatus = searchParams.get('readStatus');

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (feedId) {
      where.feedId = feedId;
    }

    if (readStatus) {
      where.read = readStatus === 'true';
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: {
        pubDate: 'desc',
      },
      include: {
        feed: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
      },
    });
    return NextResponse.json(articles, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch articles' }, { status: 500 });
  }
} 