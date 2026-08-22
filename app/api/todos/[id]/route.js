import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Todo from '@/models/Todo';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/todos/[id] - Update a personal to-do (toggle completed, edit text or category)
export async function PUT(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    await dbConnect();

    const todo = await Todo.findOne({ _id: id, user: authUser.userId });

    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'To-do not found' },
        { status: 404 }
      );
    }

    if (body.text !== undefined) todo.text = body.text.trim();
    if (body.category !== undefined) todo.category = body.category.trim();
    if (body.completed !== undefined) {
      todo.completed = Boolean(body.completed);
      todo.completedAt = body.completed ? new Date() : null;
    }

    await todo.save();

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update to-do', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - Delete a personal to-do
export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = params;

    await dbConnect();

    const deleted = await Todo.findOneAndDelete({ _id: id, user: authUser.userId });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'To-do not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'To-do deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete to-do', details: error.message },
      { status: 500 }
    );
  }
}
