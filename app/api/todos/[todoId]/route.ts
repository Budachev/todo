import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { todoId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { completed } = await req.json();
    const todo = await prisma.todo.update({
        where: { id: Number(params.todoId) },
        data: { completed },
    });
    return NextResponse.json(todo);
}

export async function DELETE(req: NextRequest, { params }: { params: { todoId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.todo.delete({
        where: { id: Number(params.todoId) },
    });
    return NextResponse.json({ success: true });
}
