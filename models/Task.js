import mongoose from 'mongoose';

const SubtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ActivityLogSchema = new mongoose.Schema({
  userName: {
    type: String,
    default: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ResourceLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
});

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [120, 'Title cannot be more than 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['planning', 'todo', 'in-progress', 'review', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [SubtaskSchema],
      default: [],
    },
    comments: {
      type: [CommentSchema],
      default: [],
    },
    activityLog: {
      type: [ActivityLogSchema],
      default: [],
    },
    links: {
      type: [ResourceLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast per-user filtered queries
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, priority: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
