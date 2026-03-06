# Herland Laundry System

A modern, full-stack laundry management web application designed for seamless customer scheduling, rider task management, and administrative oversight.

## 🚀 Features

### 👤 Customer Experience
- **Public Service Preview**: Dynamic landing page showcasing real-time service rates and add-ons.
- **Smart Booking Flow**: Easy multi-step booking process with service selection, weight calculation, and automatic address fetching.
- **Order Tracking**: Real-time vertical timeline tracking from "Booking Received" to "Delivered".
- **Digital Receipts**: Instant generation of professional receipts for every order.
- **Flexible Payments**: Integrated downpayment processing and GCash support.
- **Feedback & Reviews**: Star rating and comment system for completed orders.

### 🛵 Rider Management
- **Task Claiming**: Transparent "Accept/Decline" system for available delivery assignments.
- **Delivery Workflow**: One-tap status updates (Picked up, Out for delivery, Delivered).
- **Earnings/History**: View assigned tasks and completed deliveries.

### 👔 Staff Controls
- **Processing Management**: Update wash, dry, and fold progress for active orders.
- **Inventory Awareness**: Access to current service configurations.

### 👑 Admin Dashboard
- **Service Management**: Full CRUD capabilities to manage pricing, services, and add-ons.
- **Analytics & Reports**: Visual data on total revenue, booking volumes, and customer trends.
- **User Management**: Role-based access control for Admins, Staff, Riders, and Customers.

---

## 🛠️ Technology Stack
- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd herland-laundry-system-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd herland-laundry-system-frontend/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📖 How to Use

### For Customers
1. Visit the **Landing Page** to view current rates.
2. **Sign Up** or **Log In** to access the dashboard.
3. Click **Book Now** to start a new laundry request.
4. Track your order through the **Booking History** page.
5. Once delivered, leave a **Review** to share your experience.

### For Riders
1. Log in with a Rider account.
2. Navigate to **Available Tasks** to claim new assignments.
3. Update progress in **My Assignments** as you fulfill the delivery.

### For Admins
1. Log in with an Admin account.
2. Use the **Manage Services** tab to update pricing.
3. Check the **Reports** page for business health metrics.

---

## 🤝 Contributing
Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

## 📄 License
This project is licensed under the MIT License.
