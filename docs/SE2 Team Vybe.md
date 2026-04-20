## Herland Laundry:
Web-Based Delivery Booking System
Software Design Document
```
Client: Remedios Antonio Ramos
```
Client Address: 72 Balite Street Brgy 44 Pasay City
```
Adviser: Asst. Prof Imelda E. Marollano, DIT
```
Prepared by:
Project Manager: VICENTE, Luis Emmanuel Y.
Business Analyst: SIYHIAN, Lance J.
System Analyst: PATRICIO, Gale Ashton A.
Project Developer: GO, Cristine Anne
Quality Assurance Officer: CHUA, Téa Lorainne O.
Table of Contents
1. System Overview
2. System Architecture
2.1. Architectural Design
2.2. Use Case Diagram
2.3. Swimlane Diagram
2.4. Decomposition Description
3. Data Design
3.1. Data Description
3.2. Data Dictionary
4. Component Design
4.1. Customer Session Component
4.2. Admin & Staff Session Component
4.3 Rider Session Component
4.4 System Logic Narratives
5. Human Interface Design (SE 1)
5.1. Overview of User Interface
5.2. Screen Mockups
6. Human Interface Design (for SE2)
6.1. Overview of User Interface
6.2. Screenshots of System
6.2.1. Authentication and Access
6.2.2. Customer Dashboard & Real-Time Tracking
6.2.3. Service Selection and Booking Execution
6.2.4. Staff / Admin Verification Interface
6.2.5. Rider Logistics View
Chapter 2: Software Design Document
1. System Overview
The Herland Laundry: Web-Based Wash, Dry & Fold Booking System
aims to provide a system that Herland Laundry can use to automate their laundry
services transactions and bookings. This web-based booking system is created to
support the daily operations of the business in managing and monitoring their
customer requests. By using the system, all activities involved in the booking
process will become more organized and efficient. It will help the staff and the
owner to provide their service more accurately and conveniently by eliminating
manual recording or chat-based communication through Viber. Moreover,
customers will be able to schedule their laundry pickup and drop-off at any time
of day. Based on the limitations and shortcomings identified in the laundry shop's
manual process, the proposed system introduces a digital solution that automates
and centralizes all transactions.
2. System Architecture
Software and hardware are the two primary components of a system's
architecture. The hardware consists of mobile devices that utilize the internet to
access the web-based system. All user information, payment details, and booking
records are collected and stored by the website's server. Additionally, it serves as
the primary storage and processing unit. The network infrastructure connects
these devices to enable smooth data transmission and provide real-time access to
the system. At the same time, the software component defines the system's state.
That includes the user interface, application logic, and database structure that are
interconnected to deliver all transaction and booking functions. This architecture
ensures that the system operates securely and efficiently. It also supports both the
functional and the non-functional needs of the system.
2.1. Architectural Design
```
The system employs a Hybrid Backend-as-a-Service (BaaS) architecture,
```
expanding upon the traditional client-server model to ensure secure, scalable, and
```
efficient interactions among administrators (owners), employees (staff/riders),
```
and customers. By utilizing a responsive web-based framework, the design
guarantees usability and accessibility across various mobile and desktop devices,
allowing users to traverse the booking system seamlessly.
To support the streamlined flow of operations from initial reservation to final
delivery, the architecture is decomposed into three highly specialized tiers:
```
Frontend (Presentation Layer): Developed using React paired with Vite, this
```
```
module delivers a dynamic User Interface (UI) that effectively manages client
```
interactions and client-side rendering.
```
Middleware Backend (Application Logic): Powered by Node.js and Express,
```
this intermediary layer is strictly responsible for processing specialized business
logic. It securely executes operational constraints, such as calculating real-time
booking capacities and enforcing the 4-hour completion rule.
```
Core Backend (Data & Storage Layer): Utilizing Supabase, this centralized
```
infrastructure manages foundational data services. It employs the auth.users
module for secure credential management and password resets, leverages a
```
PostgreSQL database fortified with Row Level Security (RLS) policies to
```
maintain transaction integrity, and utilizes a dedicated Storage module to securely
process and host customer-uploaded GCash payment proofs. - Lance’s work
2.2. Detailed Use Case Diagram
Figure 2.2. Use Case Diagram
The Use Case Diagram illustrates the functional interactions between the system's designated
actors and the core application logic within the Herland Laundry System. Primary actors are
categorized into Customers, Staff, Riders, and Administrators, with strict role-based access
```
control (RBAC) enforced across the modules. The diagram demonstrates role inheritance,
```
wherein the Administrator inherits all operational capabilities of the Staff while retaining
exclusive access to system management and reporting tools. Furthermore, the architecture
highlights the integration of secondary external actors, specifically a Payment Gateway and the
Google Map API, which interface with the system to securely process digital transactions and
provide geographic routing data, respectively.
2.3. Detailed Swimlane Diagram
Figure 2.3.: Swimlane Diagram
This activity diagram maps the chronological workflow of a laundry transaction across the four
primary system partitions: Customer, Middleware/Supabase, Staff/Admin, and Rider. It
illustrates the implementation of core operational constraints, showcasing how the middleware
validates the 8-transaction capacity limit before allowing a booking, and how staff must
manually verify the 25% GCash downpayment barrier before the system permits the workflow to
transition into the active processing stage.
Figure D2.3. General System Sequence Diagram: Illustrating the overarching data flow and
architectural interaction within the Hybrid BaaS model. All user requests originate at the
```
Presentation Layer (Frontend), are processed for business constraints within the Application
```
```
Logic Layer (Middleware), and are ultimately transacted at the Data Layer (Supabase) where
```
```
Row Level Security (RLS) policies are enforced.
```
2.4. Decomposition Description
Figure 2.4. User Login Sequence Diagram:
Figure 2.4.2. Customer Booking Sequence: Illustrating the flow from a customer selecting
services on the frontend, the middleware checking the 8-transaction capacity limit, and the
backend inserting the JSONB record into Supabase.
This illustrates the Hybrid BaaS architecture, showing exactly how the React frontend, Node.js
```
middleware, and Supabase backend interact to enforce the custom business rules (like the
```
```
8-transaction capacity limit and the 4-hour rule).
```
Figure 2.4.3. Payment Verification Sequence: Demonstrating the flow of the customer
uploading a GCash receipt, the staff reviewing the payload, and the system clearing the 25%
downpayment barrier to update the status to "In Progress."
This diagram captures the dual-actor flow where the customer uploads the GCash receipt to
Supabase Storage, and the staff triggers the middleware to clear that "25% Downpayment
Barrier" we defined in the logic narratives.
Figure 2.4.4. Rider Delivery Sequence: Showing the logistics flow where the rider retrieves
assigned tasks and updates the delivery status in real-time.
This one maps out the logistics side, utilizing the specific GET and PATCH endpoints we
```
established for the Rider session and incorporating the final color-coded UI changes (Blue for
```
```
Shipping, Green for Done).
```
3. Data Design
3.1. Data Description
Collecting data from software users will not only aid the business in
```
determining the most appropriate key performance indicators (KPIs) for assessing
```
performance, but also ensure the confidentiality, integrity, and availability of the
data gathered and the users. To efficiently and effectively manage the collected
data, a simple yet robust database design must be developed to strike a balance
between ensuring faster query runtimes and easier, yet more reliable, data
management.
Figure 3.1.: Entity Relationship Diagram
```
Figure 3.1.1 shows the relationship between the data tables between the (1) Roles
```
table — comprising of user classifications including customers, staff, and administrators,
```
which determines access level, (2) User table — containing all the accounts with
```
```
different personal identifiable information (PII), user credentials, roles, and branch of the
```
laundry shop that is reachable to the distance from the location specified by the customer,
```
(3) Staff_Details table — pertaining to the information about the staff including when
```
they were hired, their status, which can be either active or terminated, and their current
```
salary, (4) Customer_Details table — encompassing the information about when they
```
```
created an account, (5) a separate Customer_Address table — providing geographical
```
```
information about the customers, (6) Orders table — listing the customer’s order
```
information such as the date when they made their order, the total amount assigned, the
status of their order, which can be pending, in progress, for delivery, and completed, and
```
the address for delivery, (7) Order_Items table — specifying the service requested by
```
the customer, the number of items they have given, and the price based on item quantity,
```
(8) Services table — showing all the available services along with its initial price, and (9)
```
Geolocation table — containing information about the postal code, which usually
specifies the city and province. Furthermore, a Guest table is created in an isolated
manner, as it will be used only for further digital auditing and minor digital reachability
assessments.
The Roles table consists of labels including customer, staff, and administrator,
which implies that only individuals who registered an account with the software will have
such labels. These classifications determine the access level granted to users, thereby
enhancing the overall security of the software.
3.2. Data Dictionary - The following table defines the consolidated data entities
utilized within the Supabase backend, reflecting the optimized schema designed for efficient
```
transaction handling and role-based access control (RBAC).
```
Table Name Type Description Parameters/Attributes
profiles Entity A consolidated table representing all
system users. It centralizes
authentication and personal details,
utilizing an enumeration to define
```
access levels (Admin, Staff, Rider,
```
```
Customer).
```
```
id (UUID, PK),
```
```
full_name (Text),
```
```
phone_number (Text),
```
```
role (user_role enum),
```
```
address (Text),
```
```
lat/lng (Numeric)
```
bookings Entity The central transaction table
consolidates previous order and
order-item structures. It employs
JSONB data types to flexibly store
complex, variable service arrays and
payment data without requiring
secondary relational tables.
```
id (Int8, PK),
```
```
user_id (FK),
```
reference_number,
stage,
status,
```
JSONB payloads(service_details,
```
```
payment_details, timeline)
```
service_item
s
Entity A unified catalog containing all
available offerings, standardizing
both primary laundry services and
auxiliary add-ons.
```
service_id (PK),
```
```
service_name (Text),
```
```
price (Numeric)
```
notifications Entity A dedicated logging table designed
to trigger and store real-time
operational alerts regarding booking
status progressions.
```
id (Int8, PK),
```
```
user_id (FK),
```
message,
is_read
shop_sched
ule
Entity A dynamic configuration table that
manages store operational hours.
This table is queried by the
middleware to enforce business
constraints, such as the 4-hour
completion rule.
```
id (UUID, PK),
```
opens,
closes
faqs Entity Manages dynamic, frequently asked
questions to populate the customer
support interface.
```
id (UUID, PK),
```
question,answer,
sort_order
4. Component Design
Figure 4.1 UML Class Diagram
4.1 Customer Session Component
This component manages the state and actions available to a registered customer. It
interfaces with the profiles, service_items, and bookings entities to facilitate
the end-to-end reservation process.
● Local Data:
○ customerID: UUID – Unique identifier for the active customer, authenticated
via Supabase.
○ activeOrderID: Int8 – Reference to the current transaction.
○ preferredAddress: Text – Derived from the consolidated user profile for
precise delivery routing.
● REST API Endpoints:
○ GET/api/v1/customer/services: Retrieves the unified list of available
primary laundry services and add-ons from the service_items entity.
○ POST/api/v1/customer/book: Initiates a new laundry request,
dynamically checking availability and creating a JSONB record in the
bookings table.
○ GET/api/v1/customer/my-bookings/:id: Queries the backend to
display the current stage and tracking status of an active transaction.
○ POST/api/v1/customer/my-bookings/:id/payment-reference:
Submits a digital receipt to Supabase Storage, updating the payload for staff
review.
4.2 Admin & Staff Session Component:
This component handles the operational logic for both staff and administrators. In this
```
architecture, the Admin (Owner) role inherits the capabilities of the Staff role, adding
```
advanced financial reporting and system management functions.
● Local Data:
○ staffID: UUID – Unique identifier for the employee or admin.
```
○ roleLevel: Enum – Defines strict access permissions (Staff vs. Admin) to
```
secure sensitive endpoints.
● REST API Endpoints:
○ PUT/api/v1/admin/bookings/:id/status: A multi-purpose endpoint
```
that manages workflow progression. It processes payment evidence (checking for
```
```
downpayment_status == 'verified') to safely transition an order from
```
"Pending" to "In Progress", and updates subsequent job stages.
○ GET/api/v1/admin/dashboard-stats: Compiles financial metrics and
system-wide data, extracting revenue calculations directly from the
payment_details JSONB structures for performance monitoring.
4.3 Rider Session Component
This component handles the specialized logistics and geographical tracking required for
delivery personnel, ensuring isolation from administrative functions.
● Local Data:
○ riderID: UUID – Unique identifier for the delivery personnel.
● REST API Endpoints:
○ GET/api/v1/rider/assigned-bookings: Retrieves a filtered list of
active delivery tasks specifically assigned to the authenticated rider.
○ PATCH /api/v1/rider/update-status/:id: Allows the rider to
```
selectively update delivery progression states (e.g., picked up, in transit,
```
```
delivered) in real-time.
```
4.4 System Logic Narratives
This section details the critical operational workflows and automated constraints
embedded within the middleware backend, bridging user actions with database
transactions.
4.4.1. Authentication Logic
The authentication sequence initiates a direct validation process via Supabase to grant users
secure access to the system based on their assigned roles.
● Credential Entry: The user provides a registered email address or contact number
alongside their password.
● Database Validation: The system interfaces with the core auth.users module to
verify credentials, subsequently querying the profiles table to retrieve the user's
specific role enumeration.
● Session Authorization: Upon a successful match, the system grants immediate, secure
```
access to the respective dashboard (Customer, Staff, Rider, or Admin) without requiring
```
secondary verification steps.
● Error Handling: If credentials fail validation, the system rejects the request with an
"Authentication Failed" state, prompting the user to re-enter their details securely.
4.4.2. Transaction and Operational Logic
The logic governing orders ensures a secure, bottleneck-free transition from the initial
customer request to service fulfillment. It enforces strict business rules regarding capacity,
timing, and financial clearing.
● Booking Initiation & Capacity Management: A customer selects a service and
specifies delivery details. To prevent operational bottlenecks, the middleware enforces a
strict Capacity Limit of 8 transactions per hour slot. The API queries the bookings
```
table for matching collection_details (date and time). If the count equals or
```
exceeds 8, the system automatically rejects the new request, ensuring the shop is never
overbooked.
● Scheduling & The 4-Hour Rule: Upon successful booking insertion, the system
calculates the expected_completion timestamp, defaulting to 4 hours from the
collection schedule. The backend cross-references this against the shop_schedule
table. If the calculated completion time falls within 4 hours of the shop's closing time or
after hours, the system automatically defers the expected_completion to 08:00
AM on the next business day.
● Payment Trigger & The 25% Downpayment Barrier: The customer is prompted to
```
choose a payment method (Cash or GCash) and upload digital payment proofs to the
```
storage bucket. The backend logic enforces a strict progression barrier: the booking is
```
locked out of the "In Progress" (Blue) stage until administrative or staff roles explicitly
```
verify either a full payment or a 25% Initial Downpayment.
● Workflow Progression: Once the downpayment barrier is administratively cleared via
the routing logic, the bookings status automatically transitions to active processing.
This signals the operational staff to commence the physical wash, dry, and fold
operations, simultaneously pushing real-time updates to the customer's dashboard.
5. Human Interface Design
5.1. Overview of User Interface
The mobile application seamlessly adapts the company logo’s color
```
scheme into its user interface (UI), prioritizing aesthetic simplicity and intuitive
```
navigation. To enhance usability and provide immediate visual feedback, the
system employs a standardized color-coding workflow for all transaction stages.
This visual language ensures that customers, staff, and riders can instantly
recognize an order's current status:
UI Stage TechnicalStatusVisual ColorIndicator Description
Received pending Gray
Initial request submitted by the customer.
Payment accepted Yellow Customers are prompted to upload proof of
payment.
Preparation in_progress Blue Laundry is actively being washed, dried, or
folded.
Shipping picked_up Blue
Rider is currently in transit for delivery.
Done delivered Green
Transaction is fully completed and cleared.
5.2. Screen Mockups
Figure 5.2.1.1. Start Page
The users are greeted with a start page, consisting of the company logo, a greeting
message, and options to create a new account if they are still not a registered user,
to log in if they already have an account, or continue as a guest if they wish to
navigate the application without an account.
Figure 5.2.1.2 Login Page
When the user presses the login button, they will be redirected to the login page,
which prompts them to enter either their registered email address or contact
number and the password. The application sets the password field to be hidden by
default, adding a layer of security when the user inputs their password. However,
if they prefer to see what has been input so far, they can press the eye icon to
reveal the characters included in the password field. The Remember Me
checkbox is enabled by default to make account access more convenient for users
once they decide to log in again. Lastly, the "Forgot Password" feature is
included on the page if the user cannot remember their password.Figure 5.2.3 Forgot Password Section
Figure 5.2.4 Customer Homepage & Dashboard
Upon successful authentication, customers are directed to their primary dashboard. This interface
is designed for immediate action, prominently displaying an "Active Bookings" card that utilizes
```
the established color-coding system (Gray, Yellow, Blue, Green) so users can track their laundry
```
status at a glance. Below the tracking section, a streamlined menu allows users to browse
available wash, dry, and fold services or initiate a new booking request.
5.2.5. Service Navigation & Booking
When a customer selects a service category, the application presents a clean, categorized list
retrieved dynamically from the service_items database. Each item displays its current price
and estimated turnaround time. The interface allows users to easily add items to their digital
basket, select their preferred delivery address from their profile, and securely proceed to the
payment gateway.
```
5.2.6. Rider View (Logistics Dashboard)
```
To ensure strict role isolation, users logging in with Rider credentials bypass the standard
customer homepage and are securely routed to a logistics-focused dashboard. This view
prioritizes active delivery queues, displaying assigned pickup and drop-off tasks. Riders can tap
on specific assignments to view the customer's text-based address and update the delivery status
to "Picked Up" or "Delivered" in real-time, instantly notifying the customer.
6. Human Interface Design (for SE2)
6.1. Overview of User Interface
The Herland Laundry System’s presentation layer, developed using React and Vite, prioritizes a
responsive, mobile-first design that ensures accessibility across various devices. From the user's
perspective, the interface is designed to minimize cognitive load by categorizing functionalities
```
strictly based on the authenticated user's role (Customer, Staff, Admin, or Rider).
```
To complete their expected features, users interact with dynamic, form-based components that
communicate directly with the middleware backend. The system provides immediate visual
feedback to the user through a standardized, color-coded tracking system that reflects the
real-time state of their transaction:
```
● Gray (Received): Acknowledges that the system has successfully logged the customer's
```
booking request into the database.
```
● Yellow (Payment): Prompts the customer to take action by uploading their GCash
```
payment proof for staff verification.
```
● Blue (Preparation / Shipping): Informs the customer that the operational staff has
```
cleared the 25% downpayment barrier and the laundry is either actively being processed
or is currently in transit with a rider.
```
● Green (Done): Provides final confirmation that the service has been completed and
```
delivered.
```
Additionally, the system utilizes toast notifications and error handling prompts (such as
```
```
"Capacity Limit Reached" or "Authentication Failed") to guide users seamlessly through
```
operational constraints without causing system crashes.
6.2. Screenshot of system6.2.1. Authentication and Access
Figure 6.2.1. System Login Interface: This interface serves as the primary security gateway. It
dynamically masks passwords and directly queries the Supabase auth.users module to route
the user to their respective role-based dashboard upon successful credential validation.
6.2.2. Customer Dashboard & Real-Time Tracking
Figure 6.2.2. Customer Dashboard: The central hub for registered customers. It fetches data
from the bookings table to populate the "Active Bookings" cards, applying the system's
```
color-coded visual feedback (Gray, Yellow, Blue, Green) to indicate the real-time progression of
```
their laundry.
6.2.3. Service Selection and Booking Execution
Figure 6.2.3. Booking Interface: This page pulls unified pricing data directly from the
service_items catalog. Customers can dynamically add wash, dry, fold, and add-on services
to their load, input their delivery address, and proceed to the GCash payment upload section.
6.2.4. Staff / Admin Verification Interface
Figure 6.2.4. Staff Operations View: This specialized interface allows administrative and staff
roles to review uploaded customer GCash receipts. By interacting with this screen, staff can
manually clear the 25% downpayment barrier, triggering the middleware to update the
transaction to the active processing stage.
6.2.5. Rider Logistics View
Figure 6.2.5. Rider Dashboard: Isolated from administrative functionalities, this interface is
exclusively designed for logistics. It displays a filtered list of active delivery and pickup tasks,
allowing the rider to execute PATCH requests to update the delivery status to "Picked Up" or
"Delivered" with a single tap.