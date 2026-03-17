Getting Started with the Project (Docker Setup)
Hey team! To get the project running locally, you no longer need to install Node.js, npm, or worry about package versions. We are now using Docker. 🐳

Here are the steps to get your local environment running:

1. Prerequisites

Ensure you have Docker Desktop installed and running on your machine.
Ensure you have git installed. 2. Pull the Latest Code Pull the latest code from the repository (specifically from the Lance-Branch-2 where the recent features and updates were added):

bash
git checkout Lance-Branch-2
git pull origin Lance-Branch-2. Set Up Environment Variables You will see two new files in the codebase called

.env.example
. You need to create your own actual

.env
files based on these templates.

Backend: In the herland-laundry-system-backend/ folder, create a file named

.env
and paste in the backend secrets (Supabase keys, Port, etc.) that Lance provides.
Frontend: In the herland-laundry-system-frontend/client/ folder, create a file named

.env
and paste in the frontend secrets (Google Maps API key, etc.) that Lance provides.
(Note: Do not commit your

.env
files. They are already in the

.gitignore
.)

4. Start the Application Open a terminal in the root folder of the project (where the

docker-compose.yml
file is located) and run this command:

bash
docker compose up -d --build 5. Access the App It will take a minute or two to download the images and install dependencies the first time. Once it says the containers have started:

The Frontend will be running at: http://localhost:5173/
The Backend will be running at: http://localhost:5000/
Note on Hot-Reloading: We have set up volume mounts, meaning if you make changes in your IDE (like VS Code), the changes will instantly reflect in the running containers! You do not need to restart Docker every time you edit a file.

(Don't forget to securely send them the actual keys that belong in those

.env
files via Discord, Slack, etc.!)

## Recent Features

### 🔐 Password Toggle

Users can now easily toggle the visibility of their password on the login screen. This enhancement improves accessibility and ensures users can verify their input before logging in, while still maintaining high security.

### 🔔 Notification System Restored

The notification feature has been fully restored and optimized for all user roles:

- **Customers**: Receive updates on booking status, laundry readiness, and payment confirmations.
- **Staff**: Get notified about new walk-in drop-offs and assigned tasks.
- **Riders**: Get instant updates on assigned pickups and deliveries.
- **Admins**: Receive system-wide updates and reports.

The system uses role-specific routing to ensure everyone gets the information relevant to them.
