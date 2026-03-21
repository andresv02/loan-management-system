# Micro-Loans Management System

A full-stack Next.js application for managing micro-loans, built with PostgreSQL, Drizzle ORM, and shadcn/ui.

## Features

### Core Functionality
- **Authentication** - Secure login/logout with session management
- **Company Management** - Add and manage companies for loan applicants
- **Loan Applications (Solicitudes)** - Receive applications via Tally webhook, review, approve or reject
- **Loans (Prestamos)** - View active loans with amortization schedules, export to CSV
- **Payments** - Record payments, view history, revert payments if needed

### Key Features
- **Duration Selection** - When approving a loan, operators can select duration from 1-12 months (2-24 quincenas), independent of client's request
- **French Amortization** - Automatically generates amortization schedules with precise interest calculations
- **Bi-weekly Payments (Quincenas)** - Payments are due on the 15th and last day of each month
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| UI | Tailwind CSS + shadcn/ui |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database

### 2. Database Setup
```sql
CREATE DATABASE microloans;
```

### 3. Environment Configuration
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/microloans"
```

### 4. Install & Run
```bash
npm install
npx drizzle-kit push:pg
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Application Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview metrics, active loans, recent activity |
| `/solicitudes` | Pending loan applications - approve to create loans |
| `/prestamos` | All loans with details, filtering, and CSV export |
| `/payments` | Record payments and view payment history |
| `/companies` | Manage company records |
| `/login` | User authentication |

## Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  companies  │◄────┤   persons   │────►│ solicitudes │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    pagos    │◄────┤  prestamos  │◄────├ amortizacion│
└─────────────┘     └─────────────┘     └─────────────┘
```

### Tables

| Table | Description |
|-------|-------------|
| `companies` | Company records for employers |
| `persons` | Applicant personal information |
| `solicitudes` | Loan applications (pending, approved, rejected) |
| `prestamos` | Approved loans with balance and status |
| `amortizacion` | Payment schedule for each loan |
| `pagos` | Payment records |

## Tally Webhook Integration

Receive loan applications from Tally.so at `/api/webhook/tally`:

```bash
curl -X POST http://localhost:3000/api/webhook/tally \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "12345678-9",
    "nombre": "John",
    "apellido": "Doe",
    "email": "john@example.com",
    "telefono": "698-1234",
    "direccion": "Panama City",
    "empresa": "Test Co",
    "salario_mensual": 1500.00,
    "meses_en_empresa": 24,
    "inicio_contrato": "2024-01-01",
    "monto_solicitado": 5000.00,
    "duracion_meses": 6,
    "tipo_cuenta_bancaria": "ahorros",
    "numero_cuenta": "123456789",
    "banco": "Banistmo"
  }'
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API endpoints
│   │   ├── companies/      # Company CRUD
│   │   ├── login/          # Authentication
│   │   ├── payments/       # Payment operations
│   │   ├── prestamos/      # Loan data endpoints
│   │   ├── solicitudes/    # Application data
│   │   └── webhook/tally/  # Tally webhook receiver
│   ├── companies/          # Companies page
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── payments/           # Payments page
│   ├── prestamos/          # Loans page
│   └── solicitudes/        # Applications page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── ApprovalModal.tsx   # Loan approval modal
│   ├── PaymentForm.tsx     # Payment recording
│   ├── PrestamosTable.tsx  # Loans data table
│   └── ...                 # Other components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
│   ├── actions.ts          # Server actions
│   ├── amortization.ts     # Amortization calculator
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   └── schema.ts           # Drizzle schema
└── types/                  # TypeScript types
```

## Loan Approval Process

1. Application arrives via Tally webhook → appears in `/solicitudes`
2. Operator clicks "Aprobar" to open approval modal
3. Operator can:
   - Select duration (1-12 months) - may differ from client's request
   - Set interest rate (total or percentage)
   - Select start date
   - Assign company
4. System generates French amortization schedule
5. Loan becomes active and appears in `/prestamos`

## Payment System

- **Quincena Schedule**: Payments due on 15th and last day of each month
- **Recording Payments**: Select loan → choose quincena → enter amount
- **Reverting Payments**: Admin can undo payments if needed
- **Auto-calculations**: Balance updates automatically after each payment

## Deployment

1. Push to Git repository
2. Deploy to Vercel, Railway, or any Node.js platform
3. Set `DATABASE_URL` environment variable
4. Run `npx drizzle-kit push:pg` to create tables

## License

MIT License
