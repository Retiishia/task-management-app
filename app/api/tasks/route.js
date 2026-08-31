import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tasks - Fetch all tasks for the logged-in user with optional filtering & search
export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to view tasks.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');

    // Strict User Data Isolation
    const query = { user: authUser.userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$and = [
        { user: authUser.userId },
        {
          $or: [
            { title: { $regex: sanitized, $options: 'i' } },
            { description: { $regex: sanitized, $options: 'i' } },
            { tags: { $regex: sanitized, $options: 'i' } },
          ],
        },
      ];
    }

    const tasks = await Task.find(query).sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task document for the logged-in user
export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to create tasks.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = await Task.create({
      user: authUser.userId,
      title: body.title,
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
      comments: [],
      links: Array.isArray(body.links) ? body.links : [],
      activityLog: [
        {
          userName: authUser.name || 'You',
          action: 'created task',
          details: `Initial status: ${(body.status || 'todo').replace('-', ' ')}`,
          createdAt: new Date(),
        },
      ],
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}
