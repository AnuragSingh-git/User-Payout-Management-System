# User Payout Management System

A full-stack payout management system designed to manage users, sales, advance payouts, final payout reconciliation, withdrawals, and transaction history.

The project was developed as part of the **SDE Intern Assignment** for **Postfaym Technologies Pvt. Ltd.**

## 🔗 Project Links

- **Live Demo:** https://user-payout-management-system.vercel.app/login
- **GitHub Repository:** https://github.com/AnuragSingh-git/User-Payout-Management-System

---

## 📌 Overview

The User Payout Management System provides a simple and secure way to manage creator/user earnings and payouts.

The system supports two main roles:

### 👨‍💼 Admin

Admins can:

- Create and manage users
- Create sales
- Run advance payout processing
- Reconcile sales
- Approve or reject sales
- View user transactions
- View and manage withdrawals
- Reverse failed, rejected, or cancelled withdrawals

### 👤 User

Users can:

- Login securely
- View their profile
- View their sales
- View their payout balance
- View transaction history
- View withdrawal history
- Request withdrawals from their available balance

---

## ✨ Key Features

- 🔐 JWT-based authentication
- 🔑 Role-based access control
- 🔒 Password hashing using bcrypt
- 👥 Admin and User roles
- 💰 10% advance payout processing
- 📊 Sale reconciliation
- 💳 User withdrawable balance management
- 🏦 Withdrawal request management
- 🔄 Withdrawal reversal
- 📜 Transaction ledger and audit history
- ⏱️ 24-hour withdrawal restriction
- 🛡️ Atomic database updates for important financial operations
- 🚨 Centralized error handling
- 📈 MongoDB indexes for frequently used queries

---

## 🏗️ System Architecture

The application follows a layered architecture:

```text
                Client / Frontend
                       |
                       v
                   REST APIs
                       |
                       v
                 Express Routes
                       |
                       v
          Authentication Middleware
                       |
                       v
                  Controllers
                       |
                       v
               Payout Service
                 / Business Logic
                       |
                       v
                 Mongoose Models
                       |
                       v
                    MongoDB
```

### Architecture Layers

| Layer | Responsibility |
|---|---|
| Routes | Defines API endpoints |
| Middleware | Authentication and authorization |
| Controllers | Handles HTTP requests and responses |
| Services | Contains business and payout logic |
| Models | Defines MongoDB schemas |
| Database | Stores users, sales, transactions, and withdrawals |

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- dotenv
- CORS

### Frontend

- React
- Vite
- JavaScript
- CSS

### Deployment

- Frontend: Vercel
- Backend: Node.js deployment
- Database: MongoDB

---

## 📁 Project Structure

```text
User-Payout-Management-System/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── payoutController.js
│   │   ├── saleController.js
│   │   ├── userController.js
│   │   └── withdrawalController.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── Sale.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   └── Withdrawal.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── payouts.js
│   │   ├── sales.js
│   │   ├── users.js
│   │   └── withdrawals.js
│   │
│   ├── services/
│   │   └── payoutService.js
│   │
│   ├── seed.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# 🗄️ Database Design

The application uses MongoDB with four main collections.

```text
                    USER
                      |
       +--------------+--------------+
       |              |              |
       v              v              v
     SALES       TRANSACTIONS    WITHDRAWALS
       |
       |
       +----------> TRANSACTIONS
```

## User

Stores user information and payout balances.

Important fields:

```text
userId
name
passwordHash
role
withdrawableBalance
totalAdvancePaid
totalFinalPayout
totalWithdrawn
lastWithdrawalAt
```

## Sale

Stores sales and their payout status.

Important fields:

```text
userId
brand
earning
status
advancePaid
advanceAmount
reconciled
finalAmount
```

Possible sale statuses:

```text
pending
approved
rejected
```

## Transaction

Acts as the financial ledger of the system.

Transaction types include:

```text
advance_payout
reconciliation_credit
reconciliation_debit
withdrawal
withdrawal_reversal
```

## Withdrawal

Stores withdrawal requests and their statuses.

Possible statuses:

```text
completed
cancelled
rejected
failed
```

---

# 💰 Payout Flow

The payout system works in two major stages.

## 1. Advance Payout

The system pays an advance of **10% of the sale earning**.

Example:

```text
Sale Earning = ₹40

Advance = ₹40 × 10%
        = ₹4
```

The system:

1. Finds eligible pending sales.
2. Checks whether advance has already been paid.
3. Marks the sale as advance-paid.
4. Calculates the advance amount.
5. Adds the amount to the user's withdrawable balance.
6. Creates a transaction record.

---

## 2. Sale Reconciliation

After the final sale status is known, the sale is reconciled.

### Approved Sale

```text
Sale Earning = ₹40
Advance Paid = ₹4

Final Reconciliation = ₹40 - ₹4
                     = ₹36
```

The user receives the remaining ₹36.

### Rejected Sale

If the sale is rejected, the advance is recovered.

```text
Advance Paid = ₹4

Reconciliation = -₹4
```

This prevents users from keeping an advance for a rejected sale.

---

# 💳 Withdrawal Flow

A user can request a withdrawal if:

- Amount is greater than zero.
- User has enough withdrawable balance.
- User has not made another withdrawal within the previous 24 hours.

Example:

```text
Available Balance = ₹100
Withdrawal Request = ₹50

New Balance = ₹100 - ₹50
            = ₹50
```

A withdrawal transaction is created for audit purposes.

---

# 🔄 Withdrawal Reversal

If an admin marks a withdrawal as:

- `cancelled`
- `rejected`
- `failed`

The system:

1. Returns the amount to the user's balance.
2. Reduces the total withdrawn amount.
3. Clears the withdrawal restriction.
4. Marks the withdrawal as reversed.
5. Creates a reversal transaction.

A withdrawal cannot be reversed twice.

---

# 🔐 Authentication and Authorization

The application uses JWT authentication.

After successful login, the server returns a JWT token.

The token is sent in API requests:

```http
Authorization: Bearer <JWT_TOKEN>
```

The application has three main authorization checks:

### `protect`

Checks whether the request has a valid JWT token.

### `adminOnly`

Allows only admin users.

### `isSelfOrAdmin`

Allows:

- A user to access their own data.
- An admin to access any user's data.

---

# 🌐 API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

## Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users` | Create user |
| GET | `/api/users` | List users |
| GET | `/api/users/:userId` | Get user details |

## Sales

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sales` | Create sale |
| GET | `/api/sales` | List sales |
| GET | `/api/sales/:id` | Get sale |
| POST | `/api/sales/:id/reconcile` | Reconcile sale |

## Payouts

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payouts/advance/run` | Run advance payout |
| GET | `/api/payouts/transactions/:userId` | Get transaction history |

## Withdrawals

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/withdrawals` | Request withdrawal |
| GET | `/api/withdrawals/:userId` | Get user's withdrawals |
| GET | `/api/withdrawals` | Get all withdrawals |
| PATCH | `/api/withdrawals/:id/status` | Update withdrawal status |

## Health Check

```http
GET /api/health
```

Example response:

```json
{
  "ok": true,
  "service": "payout-system-backend"
}
```

---

# ⚠️ Edge Cases and Failure Handling

The system handles the following scenarios:

### Invalid Login

Returns `401 Unauthorized`.

### Missing JWT

Protected endpoints return `401 Unauthorized`.

### Invalid or Expired JWT

Returns `401 Unauthorized`.

### Unauthorized User Access

Users cannot access another user's private data.

Returns `403 Forbidden`.

### Duplicate User

Unique `userId` prevents duplicate users.

### Invalid Sale Amount

Negative sale earnings are rejected.

### Duplicate Advance Payout

Atomic database updates prevent the same sale from receiving advance payout twice.

### Duplicate Reconciliation

A sale can only be reconciled once.

### Insufficient Balance

A withdrawal is rejected if the user does not have enough balance.

### Invalid Withdrawal Amount

Zero or negative withdrawal amounts are rejected.

### Multiple Withdrawals Within 24 Hours

A second withdrawal within 24 hours is blocked.

### Concurrent Withdrawals

Atomic balance updates help prevent race conditions.

### Duplicate Withdrawal Reversal

A withdrawal cannot be reversed more than once.

### Database Failure

If MongoDB is unavailable during startup, the application logs the error and exits.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB

---

## 1. Clone the Repository

```bash
git clone https://github.com/AnuragSingh-git/User-Payout-Management-System.git
```

```bash
cd User-Payout-Management-System
```

---

## 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## 3. Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Do not commit your `.env` file to GitHub.

---

## 4. Start Backend

```bash
cd backend
npm run dev
```

Or:

```bash
npm start
```

---

## 5. Start Frontend

```bash
cd frontend
npm run dev
```

The application can then be accessed through the local frontend URL shown by Vite.

---

# 🌱 Seed Data

The project includes a seed script for creating sample users and sales.

Run:

```bash
npm run seed
```

Sample credentials may include:

### Admin

```text
User ID: admin
Password: admin1234
```

### User

```text
User ID: john_doe
Password: password123
```

> These credentials are for local development/demo purposes only. They should not be used in production.

---

# 🧪 Example Payout Scenario

Suppose a user has three sales:

```text
Sale 1 = ₹40
Sale 2 = ₹40
Sale 3 = ₹40

Total Sales = ₹120
```

The 10% advance payout is:

```text
₹120 × 10%
= ₹12
```

Now assume:

```text
Sale 1 → Approved
Sale 2 → Approved
Sale 3 → Rejected
```

For approved sales:

```text
Sale 1:
₹40 - ₹4 advance = ₹36 final payout

Sale 2:
₹40 - ₹4 advance = ₹36 final payout
```

For rejected sale:

```text
₹4 advance is recovered
```

Final balance increase:

```text
₹12 advance
- ₹4 rejected sale recovery
+ ₹72 approved sale reconciliation

= ₹80
```

This demonstrates the complete advance payout and reconciliation process.

---

# 🧠 Key Design Decisions

## Why Node.js and Express?

Node.js and Express provide a lightweight and efficient platform for building REST APIs.

Benefits:

- Simple development
- Large ecosystem
- Easy MongoDB integration
- Good API performance

---

## Why MongoDB?

MongoDB provides flexible document storage and works well with Mongoose.

Benefits:

- Flexible schema
- Easy development
- Good indexing support
- Simple integration with Node.js

---

## Why a Transaction Ledger?

The transaction collection provides an audit trail.

For example:

```text
Advance Payout       +₹4
Reconciliation       +₹36
Withdrawal           -₹20
Withdrawal Reversal  +₹20
```

This makes it easier to understand how the user's balance changed.

---

## Why Atomic Updates?

Financial operations such as withdrawals and advance payouts use conditional database updates.

This helps prevent race conditions where multiple requests might try to modify the same balance at the same time.

---

## Why Separate Controllers and Services?

Controllers handle HTTP requests, while services handle business logic.

```text
Request
   |
   v
Controller
   |
   v
Service
   |
   v
Database
```

This keeps the code organized and easier to maintain.

---

# 🔮 Future Improvements

Possible improvements include:

- Add automated unit and integration tests.
- Add request validation using Joi or Zod.
- Add MongoDB transactions for multi-document financial operations.
- Add idempotency keys for financial APIs.
- Add pagination for large datasets.
- Add Swagger/OpenAPI documentation.
- Add rate limiting for login APIs.
- Add better audit logs.
- Add monitoring and centralized error reporting.
- Store monetary values as integer paise instead of floating-point numbers.
- Add financial reconciliation reports.
- Add the missing `POST /api/withdrawals` route if not already registered.

---

# 📄 Assignment Documentation

The project includes a detailed technical submission covering:

- Low-Level Design (LLD)
- Database Schema and Relationships
- Class / Module Design
- API Endpoints
- Edge Cases and Failure Scenarios
- Working Implementation
- Design Decisions and Trade-offs

---

# 👨‍💻 Author

**Anurag Singh**

- GitHub: https://github.com/AnuragSingh-git
- Project Repository: https://github.com/AnuragSingh-git/User-Payout-Management-System
- Live Demo: https://user-payout-management-system.vercel.app/login

---

# 📜 License

This project was developed for educational and technical assignment purposes.
