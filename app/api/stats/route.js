import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/stats - Aggregate task statistics for authenticated user
export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({
        success: true,
        data: { total: 0, completed: 0, inProgress: 0, todo: 0, review: 0, urgent: 0, overdue: 0, completionRate: 0 }
      });
    }

    await dbConnect();
    const userId = authUser.userId;

    const total = await Task.countDocuments({ user: userId });
    const completed = await Task.countDocuments({ user: userId, status: 'completed' });
    const inProgress = await Task.countDocuments({ user: userId, status: 'in-progress' });
    const todo = await Task.countDocuments({ user: userId, status: 'todo' });
    const review = await Task.countDocuments({ user: userId, status: 'review' });
    const urgent = await Task.countDocuments({ user: userId, priority: 'urgent' });

    const now = new Date();
    const overdue = await Task.countDocuments({
      user: userId,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        todo,
        review,
        urgent,
        overdue,
        completionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task stats', details: error.message },
      { status: 500 }
    );
  }
}
