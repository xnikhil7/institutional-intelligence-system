# Institutional Intelligence System

A full-stack institutional management platform built with Node.js, Express, Supabase PostgreSQL, and vanilla JavaScript.


## Live Demo

https://iis-client.vercel.app

## Features

- Role-based authentication (Admin / Student / Faculty)
- Attendance management
- Notices and announcements
- Result management
- Fee tracking system
- Real-time updates with Socket.IO
- PostgreSQL database integration via Supabase
- REST API architecture

## Tech Stack

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- Supabase PostgreSQL

### Authentication
- JWT
- bcrypt

### APIs & Services
- OpenAI / OpenRouter
- Google GenAI
- Puppeteer
- Axios
- Cheerio

## Project Structure

client/ → Frontend  
server/ → Backend APIs and database logic

## Installation

### Clone the Repository

```bash
git clone https://github.com/xnikhil7/institutional-intelligence-system.git
cd institutional-intelligence-system
```

### Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside `server/` and configure the following variables:

```env
DATABASE_URL=
JWT_SECRET=
OPENROUTER_API_KEY=
```

Start the backend server:

```bash
npm start
```

Backend will run on:

```text
http://localhost:5000
```

### Frontend Setup

Open a new terminal and navigate to the client directory:

```bash
cd client
```

Run the frontend using VS Code Live Server  
or open `index.html` directly in the browser.

Recommended VS Code extension:
- Live Server

Frontend will run on:

```text
http://127.0.0.1:5500
```

### Database Setup

This project uses Supabase PostgreSQL.

Run the following SQL files inside the Supabase SQL Editor:

```text
server/supabase-schema.sql
server/supabase-seed.sql
```

This will:
- Create database tables
- Configure schema
- Insert initial seed data




## Deployment

```md
## Deployment

- Frontend deployed on Vercel
- Backend deployed on Render
- Database hosted on Supabase
```

## Future Improvements

- Real-time notification system
- Analytics dashboard for attendance trends
- Faculty performance insights
- Role-based access enhancements
- Mobile-first responsive redesign
- Dockerized deployment pipeline
