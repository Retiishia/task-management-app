# 🍃 MongoDB & Mongoose Learning Guide

Welcome! This guide explains **MongoDB** (a NoSQL Document Database) and **Mongoose** (an Object Data Modeling library for Node.js) through this Task Management project.

---

## 1. What is MongoDB?

MongoDB is a **NoSQL document database**. Unlike relational databases (SQL) that store data in rigid tables with rows and columns, MongoDB stores data in flexible, JSON-like **BSON Documents**.

### Comparison: Relational (SQL) vs Document (MongoDB)

| Relational DB (PostgreSQL / MySQL) | MongoDB (NoSQL) | In This Project |
| :--- | :--- | :--- |
| Database | Database | `taskdb` |
| Table | Collection | `tasks` collection |
| Row / Record | Document | A single task JSON object |
| Column | Field | `title`, `status`, `dueDate` |
| Foreign Key / Join | Embedded Document or Reference | `subtasks` embedded array |

---

## 2. Sample MongoDB Document in this App

Here is what a task document looks like inside MongoDB:

```json
{
  "_id": "66c6d2e89f81a742801a2b1c",
  "title": "Learn Docker Basics & Compose",
  "description": "Understand containerization and multi-stage builds",
  "status": "in-progress",
  "priority": "urgent",
  "dueDate": "2026-08-24T00:00:00.000Z",
  "tags": ["Docker", "DevOps"],
  "subtasks": [
    {
      "_id": "66c6d2e89f81a742801a2b1d",
      "title": "Read DOCKER_LEARNING_GUIDE.md",
      "completed": true
    }
  ],
  "createdAt": "2026-08-22T04:00:00.000Z",
  "updatedAt": "2026-08-22T04:15:00.000Z"
}
```

### 🔑 Key Takeaways:
1. **`_id`**: An automatically generated unique 12-byte **ObjectID** (timestamp + machine id + process id + counter).
2. **Embedded Subdocuments**: Notice how `subtasks` are stored directly inside the task document! No complex SQL table join required.

---

## 3. Understanding Mongoose Schemas & Models

Look at [`models/Task.js`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/models/Task.js). Mongoose provides schema validation and type safety:

```js
const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    maxlength: 120,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
}, { timestamps: true });

// Database Indexes for Speed
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
```

---

## 4. Connection Pooling in Next.js (`lib/dbConnect.js`)

In Next.js API routes, serverless or hot-reload environments can spawn multiple DB connection requests. [`lib/dbConnect.js`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/lib/dbConnect.js) uses global caching:

```js
let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 5. Visualizing MongoDB with Mongo Express GUI

When running with Docker Compose:
1. Open your browser and navigate to: **`http://localhost:8081`**
2. Click on **`taskdb`** -> Click on **`tasks`** collection.
3. You can visually **view**, **edit**, **search**, and **delete** raw documents!

---

## 6. How CRUD Works in the API Routes

| Operation | HTTP Method | API Route | Mongoose Method |
| :--- | :--- | :--- | :--- |
| **Create** | `POST` | `/api/tasks` | `Task.create(body)` |
| **Read All / Filter** | `GET` | `/api/tasks?status=todo` | `Task.find(query).sort(...)` |
| **Read Single** | `GET` | `/api/tasks/[id]` | `Task.findById(id)` |
| **Update** | `PUT` | `/api/tasks/[id]` | `Task.findByIdAndUpdate(id, updateData)` |
| **Delete** | `DELETE` | `/api/tasks/[id]` | `Task.findByIdAndDelete(id)` |
| **Count / Stats** | `GET` | `/api/stats` | `Task.countDocuments(query)` |
