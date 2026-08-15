# DineHub

A multi-restaurant food ordering platform. Customers mix dishes from several
restaurants in one basket and track each order through the kitchen. Owners
register their own restaurant, manage their menu, and work their order queue.

**React + Tailwind** · **Node/Express (MVC)** · **MS SQL Server**

---

## Features

**Customers** — browse and search restaurants, add dishes from any number of
them to one basket, checkout, then track each order from placed to delivered.
Cancel while still pending.

**Owners** — create a restaurant, manage the menu (including marking dishes
sold out), and move orders through Accept → Preparing → On the way → Delivered.
Owners only ever see their own restaurants and orders.

---

## Design decisions

**Order lines are snapshots.** `purchase_items` stores its own copy of the dish
name and price. Raising a menu price never rewrites an old receipt, and deleting
a dish doesn't erase it from history.

**Totals are calculated server-side.** Checkout re-reads every price from the
database inside a transaction. The client sends only an address and payment
method.

**One basket, one order per restaurant.** At checkout the basket is split by
restaurant, and each group becomes its own order with its own status and
delivery — all created in a single transaction.

**Status is a state machine.** `pending → accepted → preparing →
out_for_delivery → delivered`. Any other jump is rejected.

**Role and ownership are separate checks.** Middleware asks *what kind of user
are you*; the controller asks *is this thing yours*.

---

## Setup

**Requires** Node 18+ and SQL Server with TCP/IP enabled on port 1433 and
mixed-mode authentication.

```bash
# 1. Run database/schema.sql in SSMS

# 2. Backend
cd backend
npm install
cp .env.example .env      # fill in your SQL Server details
npm run dev               # http://localhost:5000

# 3. Frontend (second terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

If the backend can't connect, TCP/IP is almost always the cause — SSMS uses
shared memory, so a working SSMS connection doesn't mean Node can reach the
server.

---

## Structure

```
backend/src/
├── config/       connection pool
├── middleware/   authenticate + requireRole
├── models/       the only place SQL is written
├── controllers/  validation and business decisions
└── routes/       URL to controller mapping

frontend/src/
├── api.js        every HTTP call, token attached
├── AuthContext   who is logged in
├── components/
└── pages/
```


---
