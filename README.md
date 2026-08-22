# 🚀 Task Management App (Next.js, React, MongoDB & Docker)

A full-stack Task Management application featuring Kanban & List views, real-time analytics, filtering, subtasks, and an educational learning path for **Docker** and **MongoDB**.

---

## 🌟 Key Features

- 📋 **Kanban & Tabular List Views**: Organize tasks across status columns (`To Do`, `In Progress`, `Under Review`, `Completed`).
- ⚡ **Full Task CRUD**: Create, edit priority/due date/subtasks/tags, update status, and delete tasks.
- 📊 **Real-time Analytics Dashboard**: Track total tasks, completion percentage, in-progress tasks, and urgent/overdue alerts.
- 🔍 **Search & Multi-Filter**: Filter tasks by text search, status, or priority level in real-time.
- 🎨 **Glassmorphism UI**: Modern dark theme with translucent panels, vibrant priority glowing badges, and micro-interactions.
- 🐳 **Dockerized Stack**: Run Next.js, MongoDB database, and Mongo Express web GUI with 1 command.
- 🍃 **Mongo Express Database Viewer**: Inspect raw MongoDB collections live at `http://localhost:8081`.
- 📚 **Interactive Learning Guides**: Detailed markdown guides explaining Docker containers and MongoDB document data modeling.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Lucide Icons, Tailwind CSS with HSL variables.
- **Backend API**: Next.js Serverless API Routes (`/api/tasks`, `/api/stats`, `/api/seed`).
- **Database**: MongoDB with Mongoose ODM (Schemas, Validation, Indexes, Connection Caching).
- **Containerization**: Docker, Dockerfile multi-stage builds, and Docker Compose.

---

## 🚀 Quickstart Guide

You can run this application in **two ways**: via **Docker Compose** (Recommended) or locally using **Node.js**.

### Option A: Running with Docker Compose (Recommended)

1. Make sure **Docker Desktop** is installed and running on your computer.
2. Open terminal in the project directory and run:
   ```bash
   docker compose up --build
   ```
3. Open your browser:
   - 📱 **Task Management App**: [`http://localhost:3000`](http://localhost:3000)
   - 🗄️ **Mongo Express DB GUI**: [`http://localhost:8081`](http://localhost:8081)

---

### Option B: Running Locally (Node.js)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have a running MongoDB instance locally (`mongodb://localhost:27017/taskdb`) or update `MONGODB_URI` in `.env.local`.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [`http://localhost:3000`](http://localhost:3000) in your browser.

---

## 📚 Learning Resources Included in Project

- 🐳 [`DOCKER_LEARNING_GUIDE.md`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/DOCKER_LEARNING_GUIDE.md): Multi-stage builds, Dockerfile directives, Compose services, and CLI commands.
- 🍃 [`MONGODB_LEARNING_GUIDE.md`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/MONGODB_LEARNING_GUIDE.md): BSON documents, Mongoose models, schema validation, connection pooling, and Mongo Express UI usage.

---

## 📂 Directory Structure

```text
task-management-app/
├── app/
│   ├── api/
│   │   ├── seed/route.js        # Sample task seeder endpoint
│   │   ├── stats/route.js       # Task metrics aggregator
│   │   ├── tasks/
│   │   │   ├── route.js         # GET / POST tasks
│   │   │   └── [id]/route.js    # GET / PUT / DELETE task by ID
│   ├── globals.css              # Custom styling & glassmorphism
│   ├── layout.js                # Root layout
│   └── page.js                  # Main dashboard page
├── components/
│   ├── KanbanBoard.js           # 4-Column status grid
│   ├── MetricsOverview.js       # Analytics summary cards
│   ├── Navbar.js                # Header & quick actions
│   ├── TaskCard.js              # Individual task card component
│   └── TaskModal.js             # Create & Edit task dialog
├── lib/
│   └── dbConnect.js             # Mongoose connection manager with caching
├── models/
│   └── Task.js                  # Mongoose Task Schema & indexes
├── Dockerfile                   # Multi-stage production build definition
├── docker-compose.yml           # Container orchestrator (Web, MongoDB, Mongo-Express)
├── DOCKER_LEARNING_GUIDE.md     # Docker educational guide
├── MONGODB_LEARNING_GUIDE.md    # MongoDB educational guide
├── package.json
└── README.md
```
