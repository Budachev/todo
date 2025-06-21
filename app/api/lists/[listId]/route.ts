import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// @ts-expect-error Next.js does not provide types for route params
export async function DELETE(req: NextRequest, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Удалять можно только свои списки
    await prisma.todoList.deleteMany({
        where: { id: params.listId, ownerId: user.id },
    });

    return NextResponse.json({ success: true });
}
