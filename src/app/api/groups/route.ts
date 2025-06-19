import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取所有分组
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { feeds: true },
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 新建分组
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: '分组名称不能为空' }, { status: 400 });
    }
    const group = await prisma.group.create({
      data: { name },
    });
    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 