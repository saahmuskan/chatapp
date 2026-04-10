# ChatApp — Real-Time Chat Application

A full-stack real-time chat app built with React, Node.js, Socket.io, and MongoDB.

## Quick Start

```bash
# 1. Setup server
cd server && cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install && npm run dev

# 2. Setup client (new terminal)
cd client && cp .env.example .env
npm install && npm run dev
```

Open http://localhost:5173

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client, Axios
- **Backend:** Node.js, Express, Socket.io, JWT, bcryptjs
- **Database:** MongoDB with Mongoose

## Features

- JWT authentication (register/login)
- Create and join chat rooms
- Real-time messaging via WebSockets
- Typing indicators
- Online user presence
- Persistent message history

See [DOCUMENTATION.md](./DOCUMENTATION.md) for full technical documentation and interview prep.
