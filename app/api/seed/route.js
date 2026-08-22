import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SAMPLE_TASKS = [
  {
    title: '🐳 Learn Docker Basics & Compose',
    description: 'Understand containerization, Dockerfile multi-stage builds, and running MongoDB + Mongo Express via Docker Compose.',
    status: 'in-progress',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 86400000 * 2),
    tags: ['Docker', 'DevOps', 'Learning'],
    subtasks: [
      { title: 'Read DOCKER_LEARNING_GUIDE.md', completed: true },
      { title: 'Run `docker compose up --build`', completed: false },
      { title: 'Inspect running containers with `docker ps`', completed: false },
    ],
  },
  {
    title: '🍃 Master MongoDB Document Data Model',
    description: 'Explore BSON document structures, Mongoose schemas, indexes, and inspect live data inside Mongo Express UI or Compass.',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000 * 3),
    tags: ['MongoDB', 'Backend', 'Database'],
    subtasks: [
      { title: 'Review lib/dbConnect.js connection pooling', completed: true },
      { title: 'Open MongoDB Compass to explore taskdb', completed: false },
      { title: 'Test CRUD operations via the Next.js UI', completed: false },
    ],
  },
  {
    title: '⚡ Implement User Authentication & JWT',
    description: 'Added User Registration, Login, bcrypt password hashing, and user-isolated database query filters.',
    status: 'completed',
    priority: 'urgent',
    dueDate: new Date(Date.now() - 86400000 * 1),
    tags: ['Auth', 'JWT', 'Security'],
    subtasks: [
      { title: 'Create User schema and auth API endpoints', completed: true },
      { title: 'Enforce per-user MongoDB query isolation', completed: true },
    ],
  },
  {
    title: '🎨 Polish Light / Dark Theme Switcher',
    description: 'Toggle between sleek dark mode and crisp light mode with persistent theme preference.',
    status: 'review',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000 * 4),
    tags: ['Frontend', 'Theme', 'CSS'],
    subtasks: [
      { title: 'Configure Light Mode HSL color variables', completed: true },
      { title: 'Add Sun/Moon theme toggle icon to Navbar', completed: true },
    ],
  },
];

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

    const tasksToInsert = SAMPLE_TASKS.map((t) => ({ ...t, user: authUser.userId }));
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
