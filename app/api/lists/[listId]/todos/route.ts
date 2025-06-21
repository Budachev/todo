import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import type { NextApiRequestContext } from 'next/server';

export async function POST(req: NextRequest, context: NextApiRequestContext) {
    const { params } = context;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    const todo = await prisma.todo.create({
        data: {
            text,
            completed: false,
            userId: user.id,
            todoListId: params.listId,
        },
    });
    return NextResponse.json(todo, { status: 201 });
}
