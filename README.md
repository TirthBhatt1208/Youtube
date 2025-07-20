# 📺 YouTube Backend Project

A scalable, RESTful backend server for a YouTube-like application built with Node.js, Express, and MongoDB.
It includes authentication, video management, playlists, community (tweets), likes, comments, dashboard, and subscriptions.
Also integrates with Cloudinary for uploading and deleting images (thumbnails, cover images, avatars).


---

## 🚀 Features

- ✅ **User management:** register, login, profile update
- ✅ **Video upload & management:** with thumbnails & cover images via Cloudinary
- ✅ **Playlist creation & management**
- ✅ **Community posts:** like tweets
- ✅ **Likes & Comments system**
- ✅ **Subscription system**
- ✅ **Dashboard with analytics**

---

### 🗂️ Project Structure

```text
controllers/
├── user.controller.js
├── video.controller.js
├── playlist.controller.js
├── community.controller.js
├── like.controller.js
├── comment.controller.js
├── dashboard.controller.js
├── subscription.controller.js

models/
├── user.model.js
├── video.model.js
├── playlist.model.js
├── community.model.js
├── like.model.js
├── comment.model.js
├── subscription.model.js

routes/
├── user.routes.js
├── video.routes.js
├── playlist.routes.js
├── community.routes.js
├── like.routes.js
├── comment.routes.js
├── dashboard.routes.js
├── subscription.routes.js

middlewares/
├── auth.middleware.js
├── multer.middleware.js

utils/
├── asyncHandler.js
├── ApiError.js
├── ApiResponse.js
└── cloudinary.js   # Utility for uploading/deleting files from Cloudinary
```



## 🧰 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **File Uploads:** Multer + Cloudinary
- **Error Handling & Responses:** Custom `ApiError` & `ApiResponse` classes
- **Async Handling:** Custom `asyncHandler`

---

## ☁️ Cloudinary Integration
- This project uses Cloudinary for:
- Uploading video thumbnails
- Uploading playlist cover images
- User avatars
- Deleting files when needed
- Utility functions for Cloudinary are located in utils/cloudinary.js.


---

## 🔐 Middlewares

- `auth.middleware.js` — Verifies JWT token & authenticates user
- `multer.middleware.js` — Handles file uploads (videos, thumbnails, etc.)

---

## 🧪 Utilities

- `asyncHandler.js` — Wraps async functions to handle errors cleanly
- `ApiError.js` — Standardized API error class
- `ApiResponse.js` — Standardized success response class
- `cloudinary.js` — Functions to upload & delete files from Cloudinary

---

## 📝 API Endpoints

| Feature         | Endpoint Base        |
|-----------------|-----------------------|
| User            | `/api/v1/users`      |
| Video           | `/api/v1/videos`     |
| Playlist	      |  `/api/v1/playlists` | 
| Community Posts | `/api/v1/community`  |
| Likes           | `/api/v1/likes`      |
| Comments        | `/api/v1/comments`   |
| Dashboard       | `/api/v1/dashboard`  |
| Subscriptions   | `/api/v1/subscriptions` |

Each feature supports CRUD operations and other specific actions where applicable.

---

## 📦 Installation

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
Create a .env file with:

init
Copy
Edit
.env.sample
Run the server:


npm run dev
🛡️ Authentication
Use the /api/v1/users/login and /api/v1/users/register endpoints to get JWT tokens.

Pass token as header:
Authorization: Bearer <token>
in all protected routes.

🧑‍💻 Contributing
Feel free to fork and raise pull requests for improvements!