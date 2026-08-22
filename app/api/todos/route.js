import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Todo from '@/models/Todo';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/todos - Get all personal to-dos for authenticated user
export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const todos = await Todo.find({ user: authUser.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error('Fetch todos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch to-dos', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/todos - Create a new personal to-do
export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.text || !body.text.trim()) {
      return NextResponse.json(
        { success: false, error: 'To-do text is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const newTodo = await Todo.create({
      user: authUser.userId,
      text: body.text.trim(),
      category: body.category ? body.category.trim() : 'General',
      completed: false,
    });

    return NextResponse.json({ success: true, data: newTodo }, { status: 201 });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create to-do', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/todos - Clear all completed to-dos for authenticated user
export async function DELETE(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const result = await Todo.deleteMany({ user: authUser.userId, completed: true });

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.deletedCount} completed to-dos`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Clear completed todos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear completed to-dos', details: error.message },
      { status: 500 }
    );
  }
}
