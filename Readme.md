# StitchLogic — Server Side

**Garments Order & Production Tracker System (Backend API)**

## 📌 Project Overview

This repository contains the **server-side implementation** of **StitchLogic**, a role-based backend system designed to manage garments products, orders, users, and production tracking for small to medium-scale garment factories.

The backend provides secure REST APIs for **authentication, role management, order lifecycle handling, and production tracking**, built with scalability, security, and real-world deployment standards in mind.

## ⚙️ Core Responsibilities

- Authentication & Authorization (JWT + Firebase)
- Role-based access control (Admin / Manager / Buyer)
- Product CRUD operations
- Order creation, approval, rejection, cancellation
- Production tracking timeline management
- User suspension & feedback handling
- Secure data storage with MongoDB

---

## 🧩 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB & Mongoose**
- **Firebase Admin SDK**
- **JWT (stored in HTTP-only cookies)**
- **Cors**
- **Dotenv**

---

## 📁 Project Structure

```
src/
├── config/            # Database & Firebase configuration
├── controllers/       # Route controllers (business logic)
├── middlewares/       # Auth, role & error middlewares
├── models/            # Mongoose schemas
├── routes/            # API route definitions
├── utils/             # Helper utilities
└── index.js           # Server entry point
```

---

## 🔐 Environment Variables

Create a `.env` file at the root of the server project:

```
PORT=5000
CLIENT_URL=https://stitch-logic.web.app

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

> ⚠️ Never expose credentials. Ensure `.env` is included in `.gitignore`.

---

## 🔒 Authentication & Security

- Firebase verifies users on login
- JWT token issued and stored in **HTTP-only cookies**
- All private routes protected via middleware
- Role-based route guards (Admin / Manager / Buyer)
- CORS configured for production client domain

---

## 🚀 Getting Started (Local Setup)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start
```

---

## 📦 API Highlights

### Products

- `POST /products` — Add product (Manager)
- `GET /products` — Get all products
- `PATCH /products/:id` — Update product
- `DELETE /products/:id` — Delete product

### Orders

- `POST /orders` — Place order (Buyer)
- `GET /orders/my` — User orders
- `GET /orders` — All orders (Admin)
- `PATCH /orders/approve/:id` — Approve order (Manager)
- `PATCH /orders/reject/:id` — Reject order (Manager)

### Users

- `GET /users` — All users (Admin)
- `PATCH /users/role/:id` — Update role / suspend
- `GET /users/profile` — Profile & suspend feedback

---

## 🧪 Quality & Deployment Standards

- Centralized error handling
- Proper HTTP status codes
- No CORS / 404 / 504 issues on production
- Production-safe cookie configuration
- API stable on page reloads & refresh

## 📂 Related Repositories

- **Client Repository:** [Link](https://github.com/samibyte/stitch-logic-client)

---

## 👤 Author

**Adnan Sami**  
Full Stack Developer
