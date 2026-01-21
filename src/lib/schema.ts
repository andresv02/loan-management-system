import {
  pgTable,
  serial,
  varchar,
  decimal,
  integer,
  timestamp,
  date,
  text,
  pgEnum,
  index,
  text as textArray,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { InferModel } from 'drizzle-orm';

export const estadoSolicitudEnum = pgEnum('estado_solicitud', ['nueva', 'aprobada', 'rechazada']);
export const estadoPrestamoEnum = pgEnum('estado_prestamo', ['activa', 'completada', 'atrasada', 'rechazada']);
export const estadoAmortizacionEnum = pgEnum('estado_amortizacion', ['pendiente', 'pagada', 'atrasada']);

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('companies_name_idx').on(table.name),
}));

export const persons = pgTable('persons', {
  id: serial('id').primaryKey(),
  cedula: varchar('cedula', { length: 20 }).notNull().unique(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellido: varchar('apellido', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  telefono: varchar('telefono', { length: 20 }),
  direccion: text('direccion'),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'set null' }),
  salarioMensual: decimal('salario_mensual', { precision: 10, scale: 2 }),
  mesesEnEmpresa: integer('meses_en_empresa'),
  inicioContrato: date('inicio_contrato'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cedulaIdx: index('persons_cedula_idx').on(table.cedula),
}));

export const solicitudes = pgTable('solicitudes', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'restrict' }),
  fotoCedula: text('foto_cedula').array(),
  montoSolicitado: decimal('monto_solicitado', { precision: 12, scale: 2 }).notNull(),
  duracionMeses: integer('duracion_meses').notNull(),
  tipoCuentaBancaria: varchar('tipo_cuenta_bancaria', { length: 50 }),
  numeroCuenta: varchar('numero_cuenta', { length: 50 }),
  banco: varchar('banco', { length: 100 }),
  empresa: varchar('empresa', { length: 200 }),
  estado: estadoSolicitudEnum('estado').default('nueva').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const prestamos = pgTable('prestamos', {
  id: serial('id').primaryKey(),
  solicitudId: integer('solicitud_id').notNull().references(() => solicitudes.id, { onDelete: 'restrict' }),
  principal: decimal('principal', { precision: 12, scale: 2 }).notNull(),
  interesTotal: decimal('interes_total', { precision: 12, scale: 2 }).notNull(),
  cuotaQuincenal: decimal('cuota_quincenal', { precision: 12, scale: 2 }).notNull(),
  totalQuincenas: integer('total_quincenas').notNull(),
  proximoPago: date('proximo_pago').notNull(),
  saldoPendiente: decimal('saldo_pendiente', { precision: 12, scale: 2 }).notNull(),
  estado: estadoPrestamoEnum('estado').default('activa').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const amortizacion = pgTable('amortizacion', {
  id: serial('id').primaryKey(),
  prestamoId: integer('prestamo_id').notNull().references(() => prestamos.id, { onDelete: 'cascade' }),
  quincenaNum: integer('quincena_num').notNull(),
  fechaQuincena: date('fecha_quincena').notNull(),
  cuotaQuincenal: decimal('cuota_quincenal', { precision: 12, scale: 2 }).notNull(),
  interes: decimal('interes', { precision: 12, scale: 2 }).notNull(),
  capital: decimal('capital', { precision: 12, scale: 2 }).notNull(),
  saldoInicial: decimal('saldo_inicial', { precision: 12, scale: 2 }).notNull(),
  saldoFinal: decimal('saldo_final', { precision: 12, scale: 2 }).notNull(),
  estado: estadoAmortizacionEnum('estado').default('pendiente').notNull(),
}, (table) => ({
  prestamoIdx: index('amortizacion_prestamo_idx').on(table.prestamoId, table.quincenaNum),
}));

export const pagos = pgTable('pagos', {
  id: serial('id').primaryKey(),
  prestamoId: integer('prestamo_id').notNull().references(() => prestamos.id, { onDelete: 'cascade' }),
  quincenaNum: integer('quincena_num'),
  fechaPago: date('fecha_pago'),
  montoPagado: decimal('monto_pagado', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  persons: many(persons),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  company: one(companies, {
    fields: [persons.companyId],
    references: [companies.id],
  }),
  solicitudes: many(solicitudes),
}));

export const solicitudesRelations = relations(solicitudes, ({ one, many }) => ({
  person: one(persons, {
    fields: [solicitudes.personId],
    references: [persons.id],
  }),
  prestamos: many(prestamos),
}));

export const prestamosRelations = relations(prestamos, ({ one, many }) => ({
  solicitud: one(solicitudes, {
    fields: [prestamos.solicitudId],
    references: [solicitudes.id],
  }),
  amortizacion: many(amortizacion),
  pagos: many(pagos),
}));

export const amortizacionRelations = relations(amortizacion, ({ one }) => ({
  prestamo: one(prestamos, {
    fields: [amortizacion.prestamoId],
    references: [prestamos.id],
  }),
}));

export const pagosRelations = relations(pagos, ({ one }) => ({
  prestamo: one(prestamos, {
    fields: [pagos.prestamoId],
    references: [prestamos.id],
  }),
}));

// Types
export type Company = InferModel<typeof companies>;
export type NewCompany = InferModel<typeof companies, 'insert'>;

export type Person = InferModel<typeof persons>;
export type NewPerson = InferModel<typeof persons, 'insert'>;

export type Solicitud = InferModel<typeof solicitudes>;
export type NewSolicitud = InferModel<typeof solicitudes, 'insert'>;

export type Prestamo = InferModel<typeof prestamos>;
export type NewPrestamo = InferModel<typeof prestamos, 'insert'>;

export type AmortRow = InferModel<typeof amortizacion>;
export type NewAmortRow = InferModel<typeof amortizacion, 'insert'>;

export type Pago = InferModel<typeof pagos>;
export type NewPago = InferModel<typeof pagos, 'insert'>;