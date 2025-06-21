import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json([], { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json([], { status: 401 });

    // Получить все списки пользователя (включая публичные и расшаренные)
    const lists = await prisma.todoList.findMany({
        where: {
            OR: [{ ownerId: user.id }, { isPublic: true }, { sharedWith: { some: { id: user.id } } }],
        },
        include: { todos: true, sharedWith: true, owner: true },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, isPublic } = await req.json();
    const list = await prisma.todoList.create({
        data: {
            title,
            isPublic: !!isPublic,
            ownerId: user.id,
        },
    });
    return NextResponse.json(list, { status: 201 });
}
