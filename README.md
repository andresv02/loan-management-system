# Micro-Loans Management System

A comprehensive full-stack Next.js (App Router, TypeScript) application for managing micro-loans. Built with PostgreSQL and Drizzle ORM for data persistence, shadcn/ui for components, TanStack Table for data tables, and integrated with Tally.so webhooks for handling loan applications.

## Features

- **Authentication**: Secure login and logout functionality with session management.
- **Company Management**: Add, view, and manage companies associated with loan applicants.
- **Loan Applications (Solicitudes)**: 
  - Receive applications via Tally webhook at `/api/webhook/tally`, creating person and solicitud records.
  - View pending solicitudes in a table with details modal.
  - Approve applications using a modal to set interest rate and next payment date, automatically generating prestamo records and amortization schedules.
- **Loans (Prestamos)**:
  - View active and all loans in responsive tables with filtering, sorting, and pagination.
  - Expandable rows showing detailed amortization tables.
  - Export loans to CSV format.
  - Mobile-friendly card views.
- **Payments**:
  - Record payments for loans, updating balances and statuses.
  - View upcoming payments and recent payment history.
  - Aggregate upcoming quincenas (bi-weekly periods) for payments.
- **Dashboard**:
  - Overview metrics cards (e.g., active loans, total outstanding, upcoming payments).
  - Active loans table with expandable amortization.
  - Recent payments summary.
- **Amortization Engine**: Calculates loan amortization schedules using a bisection method solver for precise interest matching.
- **Responsive UI**: Built with Tailwind CSS and shadcn/ui components for desktop and mobile.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: shadcn/ui, Lucide React icons
- **Data Tables**: TanStack Table (formerly React Table)
- **Forms & Validation**: React Hook Form, Zod
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom auth with cookies/sessions
- **Utilities**: date-fns, class-variance-authority
- **Deployment**: Vercel-ready

## Quick Setup

1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL database

2. **Database Setup**:
   Create a database:
   ```sql
   CREATE DATABASE microloans;
   ```

3. **Environment Configuration**:
   Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
   Update `.env.local` with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/microloans"
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Database Migrations**:
   Generate and apply migrations:
   ```bash
   npx drizzle-kit generate:pg
   npx drizzle-kit push:pg
   ```
   (Or use `migrate` if configured for migrations.)

6. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

## Navigation

- **Dashboard** (`/dashboard`): Metrics overview, active loans, and recent activity.
- **Companies** (`/companies`): Manage company records.
- **Solicitudes** (`/solicitudes`): Pending loan applications; approve to create loans.
- **Prestamos** (`/prestamos`): All loans with full details and export options.
- **Payments** (`/payments`): Record new payments and view history.
- **Login** (`/login`): User authentication.

## Testing the Tally Webhook

Send a POST request to the webhook endpoint to simulate a Tally form submission:

```bash
curl -X POST http://localhost:3000/api/webhook/tally \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "12345678-9",
    "nombre": "John",
    "apellido": "Doe",
    "foto_cedula": ["https://example.com/foto.jpg"],
    "email": "john@example.com",
    "telefono": "698-1234",
    "direccion": "Panama City",
    "empresa": "Test Co",
    "salario_mensual": 1500.00,
    "meses_en_empresa": 24,
    "inicio_contrato": "2024-01-01",
    "monto_solicitado": 5000.00,
    "duracion_meses": 12,
    "tipo_cuenta_bancaria": "ahorros",
    "numero_cuenta": "123456789",
    "banco": "Banistmo"
  }'
```

After submission, navigate to `/solicitudes` to view and approve the new application.

## Project Structure

```
.
├── public/                 # Static assets (logo, uploads)
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── api/            # API endpoints (auth, companies, prestamos, solicitudes, webhook)
│   │   ├── companies/      # Company management page
│   │   ├── dashboard/      # Dashboard page
│   │   ├── login/          # Login page
│   │   ├── payments/       # Payments page
│   │   ├── prestamos/      # Loans page
│   │   └── solicitudes/    # Applications page
│   ├── components/         # Reusable UI components (tables, modals, dialogs)
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Domain-specific components (e.g., PrestamosTable, ApprovalModal)
│   ├── hooks/              # Custom React hooks (e.g., use-loan-export, use-toast)
│   ├── lib/                # Utilities and configurations (db, schema, auth, amortization)
│   ├── types/              # TypeScript type definitions
│   └── ...                 # globals.css, layout.tsx
├── drizzle.config.ts       # Drizzle ORM configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── ...                     # Other config files (.env, .gitignore, etc.)
```

## Database Schema

The schema is defined in [src/lib/schema.ts](src/lib/schema.ts) using Drizzle ORM. Key tables include:

- `persons`: Applicant personal information.
- `companies`: Company details.
- `solicitudes`: Loan applications.
- `prestamos`: Approved loans.
- `payments`: Payment records.
- `amortization_schedules`: Loan repayment schedules.

Run migrations to create/update the schema in your database.

## Deployment

1. Push to a Git repository (e.g., GitHub).

2. Deploy to a platform that supports Next.js applications, such as:
   - Vercel
   - Netlify
   - Railway
   - AWS, Heroku, or a VPS with Node.js

3. Configure environment variables, including `DATABASE_URL` for your PostgreSQL database.

4. Ensure the database is accessible from the deployment environment and handle any necessary SSL configurations.

## Contributing

1. Fork the project.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is open-source and available under the MIT License.
