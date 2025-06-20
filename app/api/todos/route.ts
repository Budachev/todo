import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const todos = await prisma.todo.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json(todos);
}

export async function POST(req: NextRequest) {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }
    const newTodo = await prisma.todo.create({
        data: { text, completed: false },
    });
    return NextResponse.json(newTodo, { status: 201 });
}

export async function PATCH(req: NextRequest) {
    const { id, completed } = await req.json();
    const todo = await prisma.todo.update({
        where: { id },
        data: { completed },
    });
    return NextResponse.json(todo);
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json();
    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
