import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { feedId: string } }
) {
  try {
    const { feedId } = params;

    // 删除订阅源（由于设置了onDelete: Cascade，相关的文章也会被自动删除）
    await prisma.feed.delete({
      where: { id: feedId },
    });

    return NextResponse.json({ message: 'Feed deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting feed ${params.feedId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete feed' }, { status: 500 });
  }
} 