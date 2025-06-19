import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: { articleId: string } }
): Promise<Response> {
  try {
    const { articleId } = context.params;
    const data = await request.json();
    // 这里根据你的业务逻辑更新文章
    const article = await prisma.article.update({
      where: { id: articleId },
      data,
    });
    return NextResponse.json(article);
  } catch (error: any) {
    console.error(`Error updating article ${context.params.articleId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update article' }, { status: 500 });
  }
} 