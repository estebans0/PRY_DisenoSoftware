## Table of Contents

1. [Prerequisites](#prerequisites)  
2. [Repository Structure](#repository-structure)  
3. [Backend Setup (Node + Express + MongoDB Atlas)](#backend-setup-node--express--mongodb-atlas)  
   1. [1. Clone & Install](#1-clone--install)  
   2. [2. Environment Configuration](#2-environment-configuration)  
   3. [3. Install Dependencies](#3-install-dependencies)  
   4. [4. Run the Backend (Development)](#4-run-the-backend-development)
4. [Frontend Setup (Angular)](#frontend-setup-angular)  
   1. [1. Navigate & Install](#1-navigate--install)  
   2. [2. Environment Configuration](#2-environment-configuration-1)  
   3. [3. Run the Frontend (Development)](#3-run-the-frontend-development)  
   4. [4. Angular Routes & Components](#4-angular-routes--components)  
5. [User Registration & Login Flow](#user-registration--login-flow)  
6. [Common Troubleshooting](#common-troubleshooting)  
7. [Optional: Production Build & Deployment](#optional-production-build--deployment)  

---

## Prerequisites

1. **Node.js ≥ v16.x** (v20.13.1 recommended)
   - Download/install from https://nodejs.org/  (v20.13.1: https://nodejs.org/en/blog/release/v20.13.1)
   - Verify with:
     ```bash
     node -v
     npm -v
     ```
2. **npm** (comes bundled with Node.js)  
3. **Git** (for cloning the repo)
4. **MongoDB Atlas** account (for the database)
   - We will use a free “Atlas” cluster.  
   - Sign up at https://www.mongodb.com/cloud/atlas  
5. **Angular CLI** 
   ```bash
   npm install -g @angular/cli@18.2.0
   ng version
   ```
6. (Optional) **Postman** (for testing API endpoints manually)

---

## Repository Structure
- **`backend`**: Contains the Node/Express application, Mongoose schemas, controllers, and routes.  
- **`frontend`**: Contains the Angular application, standalone components, services, and Tailwind‐style layouts.

---

## Backend Setup (Node + Express + MongoDB Atlas)

### 1. Clone & Install

1. Open a terminal and clone this repository (if you haven’t already):

   ```bash
   git clone https://github.com/estebans0/PRY_DisenoSoftware.git
   cd backend
   ```

### 2. Environment Configuration

Create a file named `.env` in the `backend` root directory. This file will hold your environment variables.

```text
# backend/.env
MONGODB_URI="mongodb+srv://appUser:<password>@cluster0.0ald2.mongodb.net/pryDiseno?retryWrites=true&w=majority"
JWT_SECRET="%nsFDB$j3@bKF+0j33S"
JWT_EXPIRES_IN=2h
PORT=5000
```

> **Important**: Never commit `.env` to source control.

### 3. Install Dependencies

Ensure you are in the `backend` folder, then run:

```bash
npm install
```

This will install both production and dev dependencies, including:

- `express`  
- `mongoose`  
- `jsonwebtoken`  
- `dotenv`  
- `cors`  
- Dev dependencies: `typescript`, `@types/express`, `@types/mongoose`, `@types/jsonwebtoken`, `@types/cors`, `nodemon`, `ts-node`

Verify your `package.json` has at least:

```jsonc
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.18.1",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^6.0.12"
  },
  "devDependencies": {
    "@types/cors": "^2.8.12",
    "@types/express": "^4.17.13",
    "@types/jsonwebtoken": "^8.5.6",
    "@types/mongoose": "^5.11.97",
    "nodemon": "^2.0.22",
    "ts-node": "^10.9.1",
    "typescript": "^4.6.4"
  }
}
```

### 4. Run the Backend (Development)

Once `.env` is properly configured and dependencies are installed, start the development server:

```bash
npm run dev
```

You should see output similar to:

```
[nodemon] 3.1.10
[nodemon] starting `ts-node src/app.ts`
Connected to MongoDB Atlas
Server listening on http://localhost:5000
```

- The server listens on port **5000** by default (or whatever `process.env.PORT` is set to).

---

## Frontend Setup (Angular)

### 1. Navigate & Install

1. Open a new terminal window.  
2. Change to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Verify you have Angular CLI globally:
   ```bash
   ng version
   ```

### 2. Environment Configuration

In `frontend/src/environments/environment.ts`, ensure the `apiUrl` points to your local backend server:

```ts
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
};
```

### 3. Run the Frontend (Development)

Make sure the backend is already running (`http://localhost:5000`). Then in the `frontend` folder:

```bash
npm run start
```

This should launch the Angular dev server (typically at `http://localhost:4200`), and watch for file changes.

- If you have Angular CLI installed, you can also run:
  ```bash
  ng serve -o
  ```
- When you visit `http://localhost:4200` in your browser, you should see the home page.

### 4. Angular Routes & Components

The main Angular routing is defined in `frontend/src/app/app.routes.ts`:

- **Login/Register** pages call the backend via `AuthService` (`frontend/src/app/services/auth.service.ts`).  
- **SessionService** (`frontend/src/app/services/session.service.ts`) calls `/api/sessions` endpoints on the backend.  
- **ProfileComponent** calls `/api/users` endpoints to fetch/update user info, change password, manage notification preferences, etc.

---

## User Registration & Login Flow

1. **Register** (Angular → `POST /api/users`):  
   - Frontend’s `RegisterComponent` calls `AuthService.register(...)`  
   - Backend’s `register` handler validates input, stores new user in MongoDB, signs a JWT, and returns `{ user, token }`.  
   - On success, the Angular app typically stores `token` in `localStorage` and navigates to `/dashboard`.

2. **Login** (Angular → `POST /api/users/login`):  
   - `LoginComponent` calls `AuthService.login(...)` with `{ email, password }`.  
   - Backend’s `login` handler checks credentials and, if valid, returns `{ user, token }`.  
   - On success, the Angular app stores `token` in `localStorage` and navigates to `/dashboard`.

3. **Protected Routes**:  
   - You can guard certain routes (e.g. `/dashboard`, `/sessions`) using an `AuthGuard` that checks for the presence of a valid JWT in `localStorage` (not covered here, but recommended for production).

---

## Common Troubleshooting

1. **`Cannot find module 'dotenv'` (or other missing‐module errors)**  
   - Make sure you ran `npm install` inside both `backend` and `frontend`.  
   - If you installed new dependencies, restart your dev server.

2. **`JWT_SECRET` is undefined**  
   - Double‐check your `.env` file in `backend`.  
   - Make sure you called `dotenv.config()` before using `process.env.JWT_SECRET`.

3. **MongoDB Connection Errors**  
   - Verify your `MONGODB_URI` is correct and that your Atlas cluster allows connections from your IP.  
   - In Atlas, under “Network Access”, either whitelist your local IP or allow 0.0.0.0/0 (0.0.0.0/0 is less secure, but acceptable for initial dev).

4. **TypeScript Compilation / Type Errors**  
   - Ensure your `tsconfig.json` is properly set up (often TypeScript complaints arise if you omitted `esModuleInterop` or `outDir`).  
   - The example code above uses `RequestHandler` from `express` to satisfy Express route‐handler overloads.

5. **CORS Issues (Browser Blocks Cross‐Origin Request)**  
   - We enabled `cors()` in `app.ts`. If you still see CORS errors, double‐check that the frontend is calling the correct backend `apiUrl` (e.g. `http://localhost:5000/api`).

6. **Angular “RouterModule” Errors**  
   - If you see “Can’t bind to ‘routerLink’ since it isn’t a known property of ‘a’”, make sure in your component’s `@Component({ … imports: [...] })` you have included `RouterModule`.  
   - Example:
     ```ts
     @Component({
       standalone: true,
       imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
       selector: 'app-login',
       templateUrl: './login.component.html',
       styleUrls: ['./login.component.scss'],
     })
     export class LoginComponent { … }
     ```

---

## Optional: Production Build & Deployment

### Backend

1. Build the TypeScript:
   ```bash
   cd backend
   npm run build
   ```
2. Deploy the generated `dist` folder to your server (e.g. a VPS, Heroku, or any Node‐hosting).  
3. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`) on your host.  
4. Run:
   ```bash
   NODE_ENV=production node dist/app.js
   ```

### Frontend

1. Build the Angular app:
   ```bash
   cd frontend
   ng build --prod
   ```
2. Serve the `dist/your-app-name` folder on any static‐hosting service (GitHub Pages, Netlify, Vercel, Apache/Nginx, Azure Blob Static Website, etc.)  
3. Make sure in `environment.prod.ts` you point `apiUrl` to your deployed backend URL (e.g. `https://api.myapp.com/api`).  

---

## Summary

By following the steps above, you should have:

1. A locally running **MongoDB Atlas** cluster (free tier).  
2. A **Node/Express** backend connected to Atlas, exposing a `/api/users` CRUD + login flow.  
3. An **Angular** frontend that calls those endpoints to register/login, manage sessions, view/edit minutes, etc.  
4. Environment variables configured in `.env` (backend) and `environment.ts` (frontend).  

---

### Versions & Software Checklist

- **Node.js** ≥ v16.x (v20.13.1 recommended)  
- **npm** ≥ v8.x  
- **TypeScript** ≥ v4.6  
- **Express** 4.x  
- **Mongoose** ≥ 6.x  
- **Angular** 14.x (uses standalone components, Tailwind‐style classes, and `importProvidersFrom`)  
- **MongoDB Atlas** free tier (cluster needs to allow your IP, plus create database user)  
- **Angular CLI** (optional)  
- **cURL** or **Postman** (for manual API testing)

---

**Feel free to explore, modify, and extend this codebase.** If you run into any issues, revisit the “Common Troubleshooting” section above, or consult the official documentation links:

- [Express Documentation](https://expressjs.com/)  
- [Mongoose Documentation](https://mongoosejs.com/)  
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)  
- [Angular (Standalone Components)](https://angular.io/guide/standalone-components)  
- [JSON Web Tokens (JWT) Guide](https://jwt.io/introduction/)  
