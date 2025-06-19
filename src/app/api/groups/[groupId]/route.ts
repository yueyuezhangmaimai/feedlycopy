import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 修改分组（重命名、排序）
export async function PATCH(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { name, sortOrder } = await request.json();
    const { groupId } = params;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const group = await prisma.group.update({
      where: { id: groupId },
      data,
    });
    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除分组
export async function DELETE(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    await prisma.group.delete({ where: { id: groupId } });
    return NextResponse.json({ message: '分组已删除' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 