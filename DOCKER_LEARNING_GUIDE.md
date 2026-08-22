# 🐳 Docker Learning Guide for Developers

Welcome! This guide is designed to help you understand **Docker**, **Containers**, **Multi-stage Dockerfiles**, and **Docker Compose** through this Task Management application.

---

## 1. What is Docker?

Docker is a platform that package applications and their dependencies into standardized units called **Containers**. 

### 💡 Why use Docker?
- **"It works on my machine" problem solved**: The container runs identically on Windows, macOS, Linux, and cloud servers.
- **Isolated Environments**: MongoDB runs inside its own isolated database container, Next.js runs inside its web container.
- **Easy One-Command Setup**: Instead of manually installing MongoDB, Node.js, and Mongo-Express on your computer, `docker compose up` starts everything instantly!

---

## 2. Core Docker Concepts

| Concept | Explanation | Real-World Analogy |
| :--- | :--- | :--- |
| **Image** | Read-only template containing your application code, runtime, libraries, and environment. | A cake recipe / blueprint. |
| **Container** | A running instance of a Docker Image. You can create multiple containers from one image. | The baked cake itself. |
| **Volume** | Persistent disk storage that survives container updates or restarts. | An external hard drive. |
| **Network** | Virtual bridge connecting containers so they can communicate securely via service names (e.g. `mongodb`). | A private home Wi-Fi network. |

---

## 3. Understanding the Multi-Stage `Dockerfile`

Look at [`Dockerfile`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/Dockerfile). It uses **Multi-Stage Builds** to produce a tiny production container.

### Stage 1: `deps` (Dependency Installation)
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
```
* **`FROM node:18-alpine`**: Uses a lightweight Alpine Linux distribution (~5MB base).
* **`COPY package*.json ./`**: Docker caches this layer. NPM dependencies are only re-installed if `package.json` changes!

### Stage 2: `builder` (Next.js Application Build)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```
* Copies installed `node_modules` from Stage 1 and compiles the Next.js production build (`output: 'standalone'`).

### Stage 3: `runner` (Production Execution)
```dockerfile
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```
* Only copies the compiled standalone code, excluding development tools, compilers, and raw source code. This shrinks the container size by over **70%**!

---

## 4. Understanding `docker-compose.yml`

Docker Compose orchestrates multiple containers. Look at [`docker-compose.yml`](file:///D:/Retiishia/Project/Retiishia%20Githubs/Vibecoding%20Learning/task-management-app/docker-compose.yml):

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/taskdb
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  mongo-express:
    image: mongo-express:latest
    ports:
      - "8081:8081"
```

### Key Learnings:
1. **Service Networking**: In `MONGODB_URI=mongodb://mongodb:27017/taskdb`, the hostname `mongodb` matches the service name. Docker Compose automatically links them on an internal DNS!
2. **Persistent Volumes**: `mongo_data:/data/db` ensures that when you stop or restart your Docker containers, your MongoDB task documents are **NOT lost**.

---

## 5. Essential Docker CLI Commands

Run these commands in your project terminal:

### Start the full application stack
```bash
docker compose up --build
```
*(Add `-d` to run in detached background mode: `docker compose up -d`)*

### View running containers
```bash
docker ps
```

### Inspect container logs
```bash
# View logs for Next.js web app
docker logs task_management_web -f

# View logs for MongoDB database
docker logs task_management_mongodb -f
```

### Stop all containers cleanly
```bash
docker compose down
```

### Stop containers and clean up persistent volumes
```bash
docker compose down -v
```
