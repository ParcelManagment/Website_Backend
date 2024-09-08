# Parcel Management Backend

## Overview

The Parcel Management Backend is a Node.js application designed to handle the logistics of parcel tracking and management for a train courier service. It provides functionalities for parcel registration, tracking, and status updates. This backend is integrated with a MySQL database and uses Express for routing.

## Features

- **User Registration and Authentication**: Users can register and authenticate to track their parcels.
- **Parcel Management**: Train masters can register new parcels, update parcel details, and assign destinations.
- **Parcel Tracking**: Users can track the status and location of their parcels in real-time.
- **IoT Integration**: Receives location data from IoT devices to update parcel status during transit.

## Technologies

- **Node.js**: Runtime environment for server-side JavaScript.
- **Express**: Web framework for building APIs.
- **MySQL**: Relational database for storing parcel and user data.
- **JWT**: JSON Web Tokens for authentication.


## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm (Node Package Manager)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/ParcelManagment/Backend.git
   cd Backend


## Enviroment Variables

### Database Configuration
DB_HOST= your_db_host

DB_USER= your_db_user 

DB_PASSWORD=your_password

DB_DATABASE= your_databse (Parcel)


### jwt secret
JWT_SECRET=Your secret


## API Endpoints

### Users

- **POST /api/users/register**: Register a new user.
- **POST /api/users/login**: Authenticate a user and receive a JWT token.
- **GET /api/users/:id**: Get details of a user.
- **PUT /api/users/:id**: Update user information.

### Staff

- **POST /api/staff**: Add a new staff member.
- **GET /api/staff/:id**: Get details of a staff member.
- **PUT /api/staff/:id**: Update staff member details.
- **DELETE /api/staff/:id**: Delete a staff member.

### Package

- **POST /api/packages**: Register a new parcel.
- **GET /api/packages/:id**: Get details of a parcel.
- **PUT /api/packages/:id**: Update parcel details.
- **GET /api/packages/track/:id**: Track parcel location and status.

### Message

- **POST /api/messages**: Send a new message.
- **GET /api/messages/:id**: Get details of a specific message.
- **GET /api/messages/user/:userId**: Get all messages for a specific user.

### Admin

- **GET /api/admin/stats**: Get system statistics and analytics.
- **POST /api/admin/approve/:id**: Approve a pending request.
- **GET /api/admin/users**: List all users.
- **GET /api/admin/staff**: List all staff members.

### Device

- **POST /api/devices**: Register a new IoT device.
- **GET /api/devices/:id**: Get details of a specific device.
- **PUT /api/devices/:id**: Update device information.
- **GET /api/devices/track/:id**: Get tracking data from a specific device.
