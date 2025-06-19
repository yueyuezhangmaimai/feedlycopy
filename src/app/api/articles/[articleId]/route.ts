import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params;
    const { read } = await request.json();

    if (typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid read status' }, { status: 400 });
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { read: read },
    });

    return NextResponse.json(updatedArticle, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating article ${params.articleId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update article' }, { status: 500 });
  }
} 