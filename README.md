
### Backend Repository README.md

# Food Delivery App - Backend

The RESTful API backend for a full-stack food delivery application. Built with Node.js, Express, MongoDB, and Socket.io for real-time order notifications.


Endpoints:
- `/auth/login` - POST
- `/auth/register` - POST
- `/foods` - GET
- `/orders` - GET/POST/PUT
- `/geocode` - Geocoding utilities

## Features

- **Authentication**: JWT-based with secure httpOnly cookies
- **Role-Based Access**: Customer and admin routes
- **Real-Time Updates**: Socket.io for new order notifications and status changes
- **Order Management**: Create, view, update status, ratings
- **Security**: Helmet, CORS, rate limiting, bcrypt hashing
- **Geocoding**: Address to coordinates conversion

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB
- **Auth**: JWT + bcrypt
- **Real-Time**: Socket.io
- **Security**: Helmet, express-rate-limit, cors
