# Vaccaro Micro-Loans App

Complete full-stack Next.js (App Router, TypeScript) micro-loan management system with Tally.so webhook integration, PostgreSQL + Drizzle ORM, shadcn/ui, TanStack Table.

## Features

- Tally webhook `/api/webhook/tally` creates persons/solicitudes
- Dashboard: metrics cards, active prestamos table with expandable amortization
- Solicitudes list: approve with interest/proximoPago modal, generates prestamo + amortization table
- Prestamos list: full loans with amortization
- Payments: record payments, track payment status, update loan balances
- Amortization solver with bisection for exact interest match
- Filtering, sorting, pagination

## Setup

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE microloans;
   ```

2. **Copy environment file**:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your actual PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/microloans"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Generate and run migrations**:
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   App will be available at http://localhost:3000

## Navigation

- **Dashboard** (`/`): Overview cards, active loans table with expandable amortization
- **Solicitudes** (`/solicitudes`): Pending requests, approve with modal
- **Prestamos** (`/prestamos`): All loans with expandable amortization
- **Payments** (`/payments`): Record payments and view recent payment history
- **Companies** (`/companies`): Manage companies list, add new companies

## Test Tally Webhook

curl -X POST http://localhost:3000/api/webhook/tally -H "Content-Type: application/json" -d '{"cedula": "12345678-9", "nombre": "John", "apellido": "Doe", "foto_cedula": ["https://example.com/foto.jpg"], "email": "john@example.com", "telefono": "698-1234", "direccion": "Panama City", "empresa": "Test Co", "salario_mensual": 1500.00, "meses_en_empresa": 24, "inicio_contrato": "2024-01-01", "monto_solicitado": 5000.00, "duracion_meses": 12, "tipo_cuenta_bancaria": "ahorros", "numero_cuenta": "123456789", "banco": "Banistmo"}'

Go to /solicitudes to approve.

## Folder Structure

See task spec.

## Next Steps

- Implement full approve server action
- Solicitudes and Prestamos pages/tables
- Payments tracking
- Authentication
- Export CSV
- Deploy