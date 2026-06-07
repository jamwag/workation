import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	// Nur das public-Schema betrachten – Supabase bringt System-Schemas (auth, storage, …)
	// mit, deren Constraints einen bekannten drizzle-kit-Pull-Bug auslösen.
	// Verlässlich ist der Migrations-Workflow: `db:generate` (erzeugt SQL) + `db:migrate`
	// (wendet an, ohne die DB zu introspizieren) statt `db:push`.
	schemaFilter: ['public'],
	verbose: true,
	strict: true
});
