# Docker Compose Setup for SkillSwap with WebSocket Microservice

```yaml
version: '3.8'

services:
  # MongoDB
  mongo:
    image: mongo:latest
    container_name: skillswap-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db
    networks:
      - skillswap-network

  # Redis
  redis:
    image: redis:alpine
    container_name: skillswap-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - skillswap-network
    command: redis-server --appendonly yes

  # Main Backend Server
  backend:
    build:
      context: ./BackEnd
      dockerfile: Dockerfile
    container_name: skillswap-backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: mongodb://root:password@mongo:27017/skillswap?authSource=admin
      REDIS_URL: redis://redis:6379
      PORT: 5000
      NODE_ENV: development
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASS: ${EMAIL_PASS}
    depends_on:
      - mongo
      - redis
    networks:
      - skillswap-network
    volumes:
      - ./BackEnd:/app
      - /app/node_modules

  # WebSocket Microservice
  websocket:
    build:
      context: ./WebSocketService
      dockerfile: Dockerfile
    container_name: skillswap-websocket
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: mongodb://root:password@mongo:27017/skillswap?authSource=admin
      REDIS_URL: redis://redis:6379
      WEBSOCKET_PORT: 8000
      NODE_ENV: development
      CLIENT_URL: http://localhost:3000
    depends_on:
      - mongo
      - redis
    networks:
      - skillswap-network
    volumes:
      - ./WebSocketService:/app
      - /app/node_modules

  # Frontend (React)
  frontend:
    build:
      context: ./skillswap
      dockerfile: Dockerfile
    container_name: skillswap-frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://backend:5000
      REACT_APP_WEBSOCKET_URL: http://websocket:8000
    depends_on:
      - backend
      - websocket
    networks:
      - skillswap-network
    volumes:
      - ./skillswap:/app
      - /app/node_modules

volumes:
  mongo_data:
  redis_data:

networks:
  skillswap-network:
    driver: bridge
```

## Docker Compose Commands

### Start all services:
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### View specific service logs:
```bash
docker-compose logs -f backend
docker-compose logs -f websocket
```

### Rebuild containers:
```bash
docker-compose up -d --build
```

### Access MongoDB:
```bash
docker-compose exec mongo mongosh -u root -p password
```

### Access Redis CLI:
```bash
docker-compose exec redis redis-cli
```

## Dockerfile for Backend

```dockerfile
# BackEnd/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

## Dockerfile for WebSocket Service

```dockerfile
# WebSocketService/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
```

## Dockerfile for Frontend

```dockerfile
# skillswap/Dockerfile

FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

## Environment Setup

Create `.env` file in project root:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- WebSocket Service: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

## Service Communication

```
Frontend (3000)
    ↓
    ├─→ Backend API (5000)
    │       ├─→ MongoDB (27017)
    │       └─→ Redis (6379)
    │
    └─→ WebSocket (8000)
            ├─→ MongoDB (27017)
            └─→ Redis (6379)
```

## Monitoring

### Check service health:
```bash
curl http://localhost:5000/health
curl http://localhost:8000/health
```

### Monitor WebSocket connections:
```bash
curl http://localhost:8000/stats
```

### Monitor queue status:
```bash
curl http://localhost:5000/api/queue-stats
```
