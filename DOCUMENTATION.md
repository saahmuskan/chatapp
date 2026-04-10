# Real-Time Chat Application — Full Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack — Why Each Tool Was Chosen](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Diagram](#architecture-diagram)
5. [Backend Deep Dive](#backend-deep-dive)
6. [Frontend Deep Dive](#frontend-deep-dive)
7. [Real-Time Flow (Socket.io)](#real-time-flow)
8. [Authentication Flow (JWT)](#authentication-flow)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)
11. [How to Run Locally](#how-to-run-locally)
12. [Common Interview Questions & Answers](#interview-questions)
13. [Potential Improvements (Scalability)](#potential-improvements)

---

## 1. Project Overview

A full-stack real-time chat application built with the MERN stack + Socket.io.

**Core Features:**
- User registration and login with JWT-based authentication
- Create and join multiple chat rooms
- Real-time messaging via WebSockets (Socket.io)
- Typing indicators — shows when others are typing
- Online presence — tracks who is currently active
- Message history — last 50 messages loaded on room join
- All messages persisted in MongoDB

**What this project demonstrates:**
- Full-stack MERN development
- REST API design and JWT auth
- Real-time bi-directional communication (WebSockets)
- React state management with Context API
- MongoDB data modeling and Mongoose ODM

---

## 2. Tech Stack — Why Each Tool Was Chosen

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Component-based UI, fast HMR in development |
| Styling | Tailwind CSS | Utility-first, no context switching, fast prototyping |
| HTTP Client | Axios | Interceptors for auto-attaching JWT, cleaner than fetch |
| Real-time | Socket.io-client | Pairs with Socket.io server, handles reconnection automatically |
| State | React Context API | Simple enough for this scale — no Redux needed |
| Backend | Node.js + Express | Non-blocking I/O — excellent for handling many concurrent connections |
| Real-time Server | Socket.io | Abstracts WebSockets with rooms, namespaces, broadcasting |
| Database | MongoDB | Flexible document model, easy to iterate schema |
| ODM | Mongoose | Schema validation, middleware (pre-save hooks), query helpers |
| Auth | JWT + bcryptjs | Stateless auth — no session storage needed on the server |

---

## 3. Project Structure

```
chatapp/
│
├── server/                     # Express + Socket.io backend
│   ├── index.js                # Entry point — sets up server
│   ├── .env.example            # Environment variable template
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User schema (username, email, hashed password)
│   │   ├── Room.js             # Room schema (name, description, creator)
│   │   └── Message.js          # Message schema (content, sender ref, room ref)
│   ├── routes/
│   │   ├── auth.js             # POST /register, POST /login, GET /me
│   │   └── rooms.js            # GET /rooms, POST /rooms, GET /rooms/:id/messages
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   └── socket/
│       └── socketHandler.js    # All Socket.io event handlers
│
└── client/                     # React frontend
    ├── index.html
    ├── tailwind.config.js
    ├── src/
    │   ├── main.jsx            # React entry point
    │   ├── index.css           # Tailwind imports + custom animations
    │   ├── App.jsx             # Router + protected/public route guards
    │   ├── services/
    │   │   └── api.js          # Axios instance with JWT interceptor
    │   ├── context/
    │   │   ├── AuthContext.jsx # Global login state (user, login, logout)
    │   │   └── SocketContext.jsx # Socket.io connection (created once at login)
    │   └── components/
    │       ├── Auth/
    │       │   ├── Login.jsx
    │       │   └── Register.jsx
    │       └── Chat/
    │           ├── ChatLayout.jsx    # Page root — fetches rooms, tracks online users
    │           ├── Sidebar.jsx       # Room list + create room + user footer
    │           ├── ChatWindow.jsx    # Message history + input + all socket events
    │           ├── MessageBubble.jsx # Individual message — own vs others styling
    │           └── TypingIndicator.jsx # Animated "..." when someone is typing
```

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React)                          │
│                                                             │
│  ┌──────────────┐     ┌──────────────────────────────────┐  │
│  │  AuthContext  │     │         SocketContext            │  │
│  │  (JWT, user) │     │   (single socket connection)     │  │
│  └──────┬───────┘     └──────────────┬───────────────────┘  │
│         │                            │                      │
│  ┌──────▼───────┐     ┌──────────────▼───────────────────┐  │
│  │  Axios API   │     │         ChatWindow                │  │
│  │  (REST calls)│     │  (emit/on socket events)          │  │
│  └──────┬───────┘     └──────────────┬───────────────────┘  │
└─────────┼────────────────────────────┼─────────────────────┘
          │ HTTP/REST                  │ WebSocket
          ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js)                        │
│                                                             │
│  ┌───────────────┐    ┌─────────────────────────────────┐   │
│  │  Express REST │    │         Socket.io               │   │
│  │  /api/auth    │    │  socketAuth middleware (JWT)    │   │
│  │  /api/rooms   │    │  join_room / send_message /     │   │
│  └───────┬───────┘    │  typing_start / disconnect      │   │
│          │            └────────────────┬────────────────┘   │
└──────────┼─────────────────────────────┼───────────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    MongoDB                                    │
│   Users Collection     Rooms Collection    Messages          │
│   { username, email,   { name, desc,       { content,        │
│     password (hashed), createdBy }          sender, room }   │
│     isOnline, color }                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Backend Deep Dive

### Express Server (`index.js`)

The server wraps Express inside a raw Node.js `http.createServer()` — this is required because Socket.io needs to attach to the HTTP server directly, not just the Express app. Both REST requests and WebSocket upgrades share the same port (5000).

```js
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: CLIENT_URL } });
```

### Mongoose Models

**User.js** — Uses a `pre('save')` hook to hash the password with bcrypt before it's stored. This hook only runs when the password field is modified, so other updates (e.g., setting `isOnline: false`) don't rehash unnecessarily.

**Message.js** — Uses `ref: "User"` to link the sender field to the Users collection. When we call `.populate("sender", "username avatarColor")`, Mongoose performs a secondary DB query and replaces the ObjectId with the actual user document. This is Mongoose's version of a JOIN.

### JWT Middleware (`middleware/auth.js`)

Reads `Authorization: Bearer <token>` from headers, verifies the token using `jwt.verify()`, then fetches the user from DB and attaches them to `req.user`. Route handlers then access `req.user._id` without any additional DB queries.

### Socket Handler (`socket/socketHandler.js`)

**Authentication via middleware:**
```js
io.use(socketAuth); // Runs before the 'connection' event
```
The token is passed during socket handshake: `io(URL, { auth: { token } })`. The middleware verifies it and attaches the user to `socket.user`.

**Typing Indicator — in-memory tracking:**
```js
const typingUsers = {}; // { roomId: Set(userId) }
```
Uses a `Set` per room (not the DB) for performance. When a user types, they're added. When they send or stop, they're removed. The count is broadcast to the room. This is a common interview talking point — you **don't** persist typing state to the database.

---

## 6. Frontend Deep Dive

### React Context API

Two contexts are used:

**AuthContext** — Wraps the entire app. Stores the user object and token in `localStorage` for persistence across page refreshes. Provides `login`, `register`, `logout` functions.

**SocketContext** — Wraps only the protected chat route. Creates the socket connection when a logged-in user exists, and disconnects it on logout. By using a `useRef`, the socket instance doesn't cause re-renders.

### Axios Interceptors (`services/api.js`)

The request interceptor automatically reads the JWT from `localStorage` and injects it as an `Authorization` header on every API call. This means every component that calls the API never has to think about auth headers — it's handled centrally.

### Socket Event Flow in ChatWindow

```
User types       → handleInputChange → socket.emit("typing_start")
                                     → setTimeout → socket.emit("typing_stop")

User submits     → socket.emit("send_message", { roomId, content })
                 ← socket.on("receive_message") fires for ALL users in the room
                 → setMessages(prev => [...prev, newMessage])

User joins room  → socket.emit("join_room", roomId)
User leaves room → socket.emit("leave_room", roomId)  [cleanup in useEffect return]
```

### Message Grouping Logic

Consecutive messages from the same sender are "grouped" — the avatar and username only appear on the **first** message in each group. This is done by comparing `messages[index].sender._id` with `messages[index-1].sender._id`:

```js
const shouldShowAvatar = (messages, index) => {
  if (index === 0) return true;
  return messages[index].sender._id !== messages[index - 1].sender._id;
};
```

---

## 7. Real-Time Flow (Socket.io)

### HTTP vs WebSocket

A standard HTTP request follows a request-response cycle — the client asks, the server responds, and the connection closes. For chat, this is inefficient (you'd need to poll every second).

WebSocket creates a **persistent, bidirectional connection**. After an initial HTTP "upgrade" handshake, both sides can push data to each other at any time with no repeated headers or reconnection overhead.

Socket.io adds useful abstractions on top of raw WebSockets: **rooms** (named channels for broadcasting), **namespaces**, automatic reconnection, and fallback to long-polling if WebSockets are blocked.

### Event Lifecycle

```
Client connects    → Server verifies JWT in socketAuth middleware
Client joins room  → socket.emit("join_room", roomId)
                   → Server: socket.join(roomId) — adds socket to a named group
Client sends msg   → socket.emit("send_message", { roomId, content })
                   → Server: saves to DB, then io.to(roomId).emit("receive_message", msg)
                   → ALL sockets in that room receive the message simultaneously
Client disconnects → Server: marks user offline, removes from typing trackers
```

`socket.to(roomId)` — broadcasts to everyone in the room EXCEPT the sender.
`io.to(roomId)` — broadcasts to EVERYONE in the room INCLUDING the sender.

---

## 8. Authentication Flow (JWT)

### Why JWT instead of sessions?

Sessions require server-side storage — the server stores session data in memory or a DB and the client holds a session ID cookie. This creates **statefulness**, which means in a scaled deployment, every request must hit the same server that created the session (or you need sticky sessions/shared session store).

JWTs are **stateless** — all user info is encoded in the token itself. The server just verifies the signature; no DB lookup required. This is why JWT scales better horizontally.

### Token Flow

```
1. User registers/logs in → Server creates: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" })
2. Token sent to client → Stored in localStorage
3. Every API request → "Authorization: Bearer <token>" header
4. Server middleware → jwt.verify(token, JWT_SECRET) → decoded.id → User.findById(id)
5. req.user available in route handlers and socket handlers
```

### Why bcryptjs?

Passwords are hashed with bcrypt before storage. bcrypt is intentionally slow (it has a "work factor") which makes brute-force attacks computationally expensive. `bcrypt.genSalt(10)` creates a salt — a random value mixed into the hash so two identical passwords produce different hashes (prevents rainbow table attacks).

---

## 9. Database Schema

### Users
```
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique, lowercase),
  password: String (bcrypt hash, never plain text),
  isOnline: Boolean (default: false),
  avatarColor: String (hex color for UI avatar),
  createdAt: Date,
  updatedAt: Date
}
```

### Rooms
```
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  createdBy: ObjectId → ref: "User",
  members: [ObjectId → ref: "User"],
  createdAt: Date,
  updatedAt: Date
}
```

### Messages
```
{
  _id: ObjectId,
  content: String (max 1000 chars),
  sender: ObjectId → ref: "User",
  room: ObjectId → ref: "Room",
  createdAt: Date,   ← this is the message timestamp
  updatedAt: Date
}
```

**Why separate collections instead of embedding?**

In MongoDB, you can embed documents or reference them. Messages are embedded in rooms is NOT a good idea because:
- A busy room could accumulate thousands of messages, growing the document past MongoDB's 16MB limit
- You'd need to fetch the entire room document just to get recent messages
- Separate collection allows efficient indexing on `room` + `createdAt`

---

## 10. API Reference

### Auth Routes

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/register | { username, email, password } | No | Register new user |
| POST | /api/auth/login | { email, password } | No | Login, returns JWT |
| GET | /api/auth/me | — | Yes | Get current user info |

### Room Routes (all require JWT)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | /api/rooms | — | Get all rooms |
| POST | /api/rooms | { name, description } | Create a room |
| GET | /api/rooms/:id/messages | — | Get last 50 messages |

### Socket.io Events

**Client → Server (emit):**

| Event | Payload | When |
|-------|---------|------|
| join_room | roomId: string | User navigates to a room |
| leave_room | roomId: string | User leaves a room |
| send_message | { roomId, content } | User sends a message |
| typing_start | { roomId } | User starts typing |
| typing_stop | { roomId } | User stops typing |

**Server → Client (on):**

| Event | Payload | When |
|-------|---------|------|
| receive_message | Message object | New message in any joined room |
| typing_update | { count, roomId } | Typing count changes |
| user_joined | { userId, username, avatarColor } | Someone joins the room |
| user_left | { userId, username } | Someone leaves the room |
| user_offline | { userId } | Someone disconnects entirely |

---

## 11. How to Run Locally

### Prerequisites
- Node.js v18+
- MongoDB running locally OR a MongoDB Atlas connection string

### Step 1 — Clone and install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2 — Environment Variables

```bash
# In server/ directory
cp .env.example .env
# Edit .env — set your MONGO_URI and JWT_SECRET

# In client/ directory
cp .env.example .env
# VITE_API_URL and VITE_SOCKET_URL default to localhost, no change needed locally
```

### Step 3 — Run both servers

```bash
# Terminal 1 — start the backend
cd server
npm run dev   # uses nodemon for auto-restart

# Terminal 2 — start the frontend
cd client
npm run dev   # Vite starts on http://localhost:5173
```

Open http://localhost:5173 in two browser windows and test real-time messaging.

### Step 4 — Deploy

**Backend → Render.com (free tier)**
- Connect your GitHub repo, set root to `server/`
- Add environment variables in Render dashboard
- Start command: `node index.js`

**Frontend → Vercel (free tier)**
- Connect repo, set root to `client/`
- Add `VITE_API_URL` and `VITE_SOCKET_URL` pointing to your Render backend URL

---

## 12. Common Interview Questions & Answers

**Q: What is the difference between HTTP and WebSocket?**
HTTP is a request-response protocol — the client must initiate every exchange. WebSocket is a persistent, full-duplex connection initiated via an HTTP upgrade handshake. After the handshake, both client and server can push data at any time without repeated headers or new connections. For chat applications, this eliminates the need for polling and significantly reduces latency and server overhead.

**Q: How does Socket.io's room system work?**
A Socket.io "room" is a named channel. When `socket.join("roomId")` is called, that socket is added to a server-side set. `io.to("roomId").emit(...)` iterates that set and delivers the event to every socket in it. Rooms are purely server-side — the client doesn't know about other sockets in the room. This is the mechanism behind our chat rooms: joining a room lets you broadcast to all members without knowing their socket IDs.

**Q: Why JWT over session-based auth?**
Sessions are stateful — the server stores session data and clients send a session ID. This doesn't scale horizontally without a shared session store (like Redis). JWTs are stateless — all claims are encoded in the token and verified with a secret key. No server-side storage is needed, so any server in a cluster can validate the token. The trade-off is that JWTs can't be "invalidated" before expiry without a blocklist.

**Q: What is bcrypt and why is it used for passwords?**
bcrypt is a password hashing function with an adjustable cost factor. Unlike MD5 or SHA-256 which are fast, bcrypt is deliberately slow — the work factor (10 in our code) means each hash takes ~100ms. This makes brute-force attacks ~10 million times harder. bcrypt also automatically generates and stores a random salt per password, preventing rainbow table attacks (where precomputed hashes are used to reverse common passwords).

**Q: How does your typing indicator work without storing data in the database?**
The typing state lives in a server-side JavaScript object (`typingUsers`) — a plain JS Map/Set in RAM. When a user starts typing, they're added to the Set for that room; when they stop or send, they're removed. The count is broadcast to the room via Socket.io. Because typing indicators are ephemeral (they don't need to persist across server restarts), RAM is the right choice — it's O(1) lookup and avoids unnecessary DB writes.

**Q: What happens if the server crashes and restarts?**
The socket connections are dropped — clients will receive a `disconnect` event. Socket.io-client has built-in reconnection: it retries the connection with exponential backoff. Once reconnected, the client would need to re-emit `join_room` to rejoin. Message history is in MongoDB so it's safe. The in-memory typing tracker would be reset, which is acceptable.

**Q: How would you scale this to handle 100,000 concurrent users?**
The main bottleneck is Socket.io — in a single server, all sockets live in one process. To scale horizontally (multiple Node.js processes/servers), you'd use the `@socket.io/redis-adapter`. This uses Redis pub/sub so that when one server calls `io.to(roomId).emit(...)`, Redis broadcasts it to all other servers and they deliver it to their own connected clients. You'd also add a load balancer with sticky sessions (same client always hits same server during the initial WebSocket handshake).

---

## 13. Potential Improvements

**Performance:**
- Add MongoDB indexes on `Message.room` + `Message.createdAt` for faster history queries
- Implement cursor-based pagination for message history (instead of hard limit 50)
- Redis adapter for Socket.io horizontal scaling

**Features:**
- Direct messages (1-to-1 private chat)
- File/image uploads (AWS S3 + presigned URLs)
- Message reactions and read receipts
- Push notifications (Web Push API)
- Search messages

**Security:**
- Rate limiting on REST API (express-rate-limit)
- Rate limiting on Socket.io events (prevent message spam)
- Input sanitization (helmet.js for HTTP headers)
- Refresh token + access token pattern (short-lived access tokens, long-lived refresh tokens)

**Code Quality:**
- TypeScript for type safety
- Jest + React Testing Library for unit tests
- Supertest for API integration tests
- ESLint + Prettier configuration