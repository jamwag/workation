import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let instance: PostgresJsDatabase<typeof schema> | undefined;

function getDb(): PostgresJsDatabase<typeof schema> {
	if (!instance) {
		if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
		instance = drizzle(postgres(env.DATABASE_URL), { schema });
	}
	return instance;
}

// Lazy-Verbindung: postgres() wird erst beim ersten Datenbankzugriff aufgebaut, nicht beim
// Import dieses Moduls. Dadurch benötigen weder der SvelteKit-Build (dessen analyse-Phase die
// Server-Module importiert) noch CI-Umgebungen ohne Datenbank eine gültige DATABASE_URL.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
	get(_target, prop) {
		const target = getDb();
		const value = Reflect.get(target, prop);
		return typeof value === 'function' ? value.bind(target) : value;
	}
});
