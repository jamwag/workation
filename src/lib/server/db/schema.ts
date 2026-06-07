import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	// scrypt-Hash im Format "salt:hash" (beide hex) – siehe lib/server/auth.ts
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	// In der DB liegt nur der SHA-256-Hash des Session-Tokens, nicht das Token selbst.
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
