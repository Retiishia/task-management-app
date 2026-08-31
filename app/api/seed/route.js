import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';
import sampleTasks from '@/data/sampleTasks.json';

export const dynamic = 'force-dynamic';

// POST /api/seed - Seed database with sample tasks for the authenticated user
export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to seed sample tasks.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Clear existing tasks for THIS user only
    await Task.deleteMany({ user: authUser.userId });

    const tasksToInsert = sampleTasks.map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: new Date(Date.now() + 86400000 * (t.dueDaysOffset || 1)),
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      links: t.links || [],
      comments: (t.comments || []).map((c) => ({
        user: authUser.userId,
        userName: c.userName || authUser.name || 'You',
        text: c.text,
        createdAt: new Date(Date.now() - 3600000 * (c.hoursAgo || 1)),
      })),
      activityLog: [
        {
          userName: authUser.name || 'You',
          action: 'created task',
          details: `Initial status: ${(t.status || 'todo').replace('-', ' ')}`,
          createdAt: new Date(Date.now() - 86400000),
        },
        ...(t.activityLog || []).map((a) => ({
          userName: a.userName || authUser.name || 'You',
          action: a.action,
          details: a.details || '',
          createdAt: new Date(Date.now() - 3600000 * (a.hoursAgo || 2)),
        })),
      ],
      user: authUser.userId,
    }));

    const createdTasks = await Task.insertMany(tasksToInsert);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdTasks.length} sample tasks for your account!`,
      data: createdTasks,
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}
