import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { listId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Проверяем, что текущий пользователь — владелец списка
    const list = await prisma.todoList.findUnique({
        where: { id: params.listId },
    });
    if (!list || list.ownerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    const unshareUser = await prisma.user.findUnique({ where: { email } });
    if (!unshareUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Убираем пользователя из sharedWith
    await prisma.todoList.update({
        where: { id: params.listId },
        data: {
            sharedWith: { disconnect: { id: unshareUser.id } },
        },
    });

    return NextResponse.json({ success: true });
}
