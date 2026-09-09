import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/tasks/[id]/comments - Add a new comment to a task
export async function POST(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const body = await request.json();

    if (!body.text || !body.text.trim()) {
      return NextResponse.json({ success: false, error: 'Comment text is required' }, { status: 400 });
    }

    const newComment = {
      user: authUser.userId,
      userName: authUser.name || 'User',
      text: body.text.trim(),
      createdAt: new Date(),
    };

    const newLog = {
      userName: authUser.name || 'User',
      action: 'commented',
      details: body.text.trim().length > 60 ? `${body.text.trim().substring(0, 60)}...` : body.text.trim(),
      createdAt: new Date(),
    };

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: authUser.userId },
      {
        $push: {
          comments: newComment,
          activityLog: newLog,
        },
      },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      comment: updatedTask.comments[updatedTask.comments.length - 1],
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add comment', details: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/comments - Remove a comment from a task
export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ success: false, error: 'Comment ID is required' }, { status: 400 });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: authUser.userId },
      {
        $pull: {
          comments: { _id: commentId },
        },
      },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete comment', details: error.message }, { status: 500 });
  }
}
