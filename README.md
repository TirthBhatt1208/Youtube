📺 YouTube Backend Project
A scalable, RESTful backend server for a YouTube-like application built with Node.js, Express, and MongoDB.
It includes authentication, video management, tweet (tweets), likes, comments, dashboard, and subscriptions.

🚀 Features
✅ User management: register, login, profile update
✅ Video upload & management
✅ tweet posts (like tweets)
✅ Likes & Comments system
✅ Subscription system
✅ Dashboard with analytics

🗂️ Project Structure
pgsql
Copy
Edit
/controllers
  ├── user.controller.js
  ├── video.controller.js
  ├── tweet.controller.js
  ├── like.controller.js
  ├── comment.controller.js
  ├── dashboard.controller.js
  ├── subscription.controller.js

/models
  ├── user.model.js
  ├── video.model.js
  ├── tweet.model.js
  ├── like.model.js
  ├── comment.model.js
  ├── subscription.model.js

/routes
  ├── user.routes.js
  ├── video.routes.js
  ├── tweet.routes.js
  ├── like.routes.js
  ├── comment.routes.js
  ├── dashboard.routes.js
  ├── subscription.routes.js

/middlewares
  ├── auth.middleware.js
  ├── multer.middleware.js

/utils
  ├── asyncHandler.js
  ├── ApiError.js
  ├── ApiResponse.js
🧰 Tech Stack
Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

Authentication: JWT

File Uploads: Multer

Error Handling & Responses: Custom ApiError & ApiResponse classes

Async Handling: Custom asyncHandler

🔐 Middlewares
auth.middleware.js — Verifies JWT token & authenticates user

multer.middleware.js — Handles file uploads (videos, thumbnails, etc.)

🧪 Utilities
asyncHandler.js — Wraps async functions to handle errors cleanly

ApiError.js — Standardized API error class

ApiResponse.js — Standardized success response class

📝 API Endpoints
Feature	Endpoint Base
User	/api/v1/users
Video	/api/v1/videos
tweet 	/api/v1/tweet
Likes	/api/v1/likes
Comments	/api/v1/comments
Dashboard	/api/v1/dashboard
Subscriptions	/api/v1/subscriptions

Each feature supports CRUD operations and other specific actions where applicable.

📦 Installation
bash
Copy
Edit
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
Create a .env file with:

ini
Copy
Edit
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/your-db
JWT_SECRET=your_jwt_secret
Run the server:

bash
Copy
Edit
npm run dev
🛡️ Authentication
Use the /api/v1/users/login and /api/v1/users/register endpoints to get JWT tokens.

Pass token as Authorization: Bearer <token> in all protected routes.

🧑‍💻 Contributing
Feel free to fork and raise pull requests for improvements!