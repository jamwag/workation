import { randomUUID } from 'node:crypto';
import {
	boolean,
	customType,
	date,
	integer,
	pgTable,
	text,
	time,
	timestamp,
	unique
} from 'drizzle-orm/pg-core';

// Binärtyp für komprimierte Beleg-Bilder (Postgres bytea).
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return 'bytea';
	}
});

export const user = pgTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	username: text('username').notNull().unique(),
	// scrypt-Hash im Format "salt:hash" (beide hex) – siehe lib/server/auth.ts
	passwordHash: text('password_hash').notNull(),
	// Globale Rolle, erweiterbar. Aktuell: 'admin' | 'member'.
	role: text('role').notNull().default('member'),
	// PayPal.me-Handle oder -E-Mail; nötig, damit andere einem Geld schicken können.
	paypalHandle: text('paypal_handle')
});

export const session = pgTable('session', {
	// In der DB liegt nur der SHA-256-Hash des Session-Tokens, nicht das Token selbst.
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const workation = pgTable('workation', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name').notNull(),
	startDate: date('start_date').notNull(),
	endDate: date('end_date').notNull(),
	createdById: text('created_by_id')
		.notNull()
		.references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Teilnahme/Einladung eines Users an einer Workation.
export const workationMember = pgTable(
	'workation_member',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => randomUUID()),
		workationId: text('workation_id')
			.notNull()
			.references(() => workation.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// 'invited' | 'accepted' | 'declined'
		status: text('status').notNull().default('invited'),
		invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [unique('workation_member_unique').on(t.workationId, t.userId)]
);

// Tagesplan-Eintrag (kleiner Kalender). Nur Admins legen Einträge an.
export const scheduleEntry = pgTable('schedule_entry', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	workationId: text('workation_id')
		.notNull()
		.references(() => workation.id, { onDelete: 'cascade' }),
	day: date('day').notNull(),
	startTime: time('start_time'),
	endTime: time('end_time'),
	title: text('title').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Eine Ausgabe, die ein Teilnehmer für die Gruppe verauslagt hat.
export const expense = pgTable('expense', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	workationId: text('workation_id')
		.notNull()
		.references(() => workation.id, { onDelete: 'cascade' }),
	paidById: text('paid_by_id')
		.notNull()
		.references(() => user.id),
	description: text('description').notNull(),
	// Geldbeträge immer als Ganzzahl in Cent – nie als Float.
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull().default('EUR'),
	// Komprimiertes Beleg-Bild (optional), ausgeliefert über einen geschützten Endpoint.
	receiptImage: bytea('receipt_image'),
	receiptMimeType: text('receipt_mime_type'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Anteil eines einzelnen Teilnehmers an einer Ausgabe (Aufteilung auf ausgewählte Personen).
export const expenseShare = pgTable(
	'expense_share',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => randomUUID()),
		expenseId: text('expense_id')
			.notNull()
			.references(() => expense.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		amountCents: integer('amount_cents').notNull(),
		settled: boolean('settled').notNull().default(false)
	},
	(t) => [unique('expense_share_unique').on(t.expenseId, t.userId)]
);

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Workation = typeof workation.$inferSelect;
export type WorkationMember = typeof workationMember.$inferSelect;
export type ScheduleEntry = typeof scheduleEntry.$inferSelect;
export type Expense = typeof expense.$inferSelect;
export type ExpenseShare = typeof expenseShare.$inferSelect;
