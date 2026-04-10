# Chatroom 💬

A simple real-time chat application where users can join rooms and talk instantly — no refresh needed.

## Why I built this
I wanted to understand how apps like WhatsApp and Discord actually work behind the scenes, especially how messages appear instantly.
So I built this project to learn real-time communication using WebSockets.

##Features
* User signup & login (JWT authentication)
* Create and join chat rooms
* Send messages in real-time
* Typing indicator (shows when someone is typing)
* Online users tracking
* Messages stored in database

##Tech Stack
**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express, Socket.io
**Database:** MongoDB

---

## ⚡ Challenges I faced

* Understanding how Socket.io works in real-time
* Connecting frontend and backend properly
* Handling authentication with JWT
* Managing typing indicator without slowing down the app

## 📸 Screenshots

### 🔐 Login Page
<img width="1920" height="920" alt="image" src="https://github.com/user-attachments/assets/fc857374-f413-4d38-9583-a1f6f50ad9db" />

### 💬 Chat Room
<img width="1920" height="920" alt="image" src="https://github.com/user-attachments/assets/c427aee8-8f64-4433-ad8f-38c641f2b8a7" />

## ▶️ How to run locally

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev
```

##Future Improvements

* Add emojis support 😊
* Add file/image sharing
* Improve UI design
* Deploy for public use
* 
## 🙋‍♀️ Author
Muskan Shah
B.Tech Computer Science Student
Interested in Full Stack Development
