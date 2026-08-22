import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tasks/[id] - Fetch single task by ID (User Isolated)
export async function GET(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const task = await Task.findOne({ _id: id, user: authUser.userId });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid task ID', details: error.message }, { status: 400 });
  }
}

// PUT /api/tasks/[id] - Update task fields (User Isolated)
export async function PUT(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: authUser.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ success: false, error: 'Task not found or permission denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task', details: error.message }, { status: 400 });
  }
}

// DELETE /api/tasks/[id] - Delete task (User Isolated)
export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const deletedTask = await Task.findOneAndDelete({ _id: id, user: authUser.userId });
    if (!deletedTask) {
      return NextResponse.json({ success: false, error: 'Task not found or permission denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete task', details: error.message }, { status: 400 });
  }
}
