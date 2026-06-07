import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import {
	createHash,
	randomBytes,
	randomUUID,
	scrypt as scryptCallback,
	timingSafeEqual,
	type ScryptOptions
} from 'node:crypto';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

// Eigener Promise-Wrapper statt util.promisify: promisify trifft die scrypt-Überladung
// ohne Options-Objekt, wodurch die scrypt-Parameter (4. Argument) nicht typisierbar wären.
function scrypt(
	password: string,
	salt: Buffer,
	keylen: number,
	options: ScryptOptions
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
			if (err) reject(err);
			else resolve(derivedKey);
		});
	});
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const SESSION_LIFETIME_MS = DAY_IN_MS * 30;
// Sliding expiration: Session verlängern, sobald weniger als die Hälfte der Laufzeit übrig ist.
const SESSION_RENEW_BEFORE_MS = DAY_IN_MS * 15;

export const sessionCookieName = 'auth-session';

// scrypt-Parameter (OWASP-konform). r=16 erhöht den Speicherbedarf auf ~32 MB,
// daher maxmem explizit anheben, sonst wirft Node bei der Ableitung.
const SCRYPT_PARAMS = { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 } as const;
const SCRYPT_KEYLEN = 64;

export function generateUserId(): string {
	return randomUUID();
}

/**
 * Erzeugt ein kryptografisch zufälliges Session-Token (Klartext für den Cookie).
 * 24 Bytes ≈ 192 Bit Entropie, base64url-kodiert (keine externe Encoding-Lib nötig).
 */
export function generateSessionToken(): string {
	return randomBytes(24).toString('base64url');
}

/** Das Token wird nie im Klartext gespeichert – nur sein SHA-256-Hash dient als Session-ID. */
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: string): Promise<table.Session> {
	const session: table.Session = {
		id: hashToken(token),
		userId,
		expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = hashToken(token);
	const [result] = await db
		.select({
			user: { id: table.user.id, username: table.user.username },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - SESSION_RENEW_BEFORE_MS) {
		session.expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
	await db.delete(table.session).where(eq(table.session.userId, userId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		sameSite: 'lax'
		// `secure` setzt SvelteKit automatisch (true außer auf http://localhost).
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.delete(sessionCookieName, { path: '/' });
}

/** Leitet aus dem Passwort einen scrypt-Hash ab und liefert "salt:hash" (hex). */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const derivedKey = await scrypt(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
	return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/** Prüft ein Passwort gegen einen gespeicherten "salt:hash" – timing-safe. */
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
	const [saltHex, keyHex] = stored.split(':');
	if (!saltHex || !keyHex) return false;

	const key = Buffer.from(keyHex, 'hex');
	const derivedKey = await scrypt(
		password.normalize('NFKC'),
		Buffer.from(saltHex, 'hex'),
		key.length,
		SCRYPT_PARAMS
	);

	return key.length === derivedKey.length && timingSafeEqual(key, derivedKey);
}

export type SessionValidationResult =
	| { session: table.Session; user: Pick<table.User, 'id' | 'username'> }
	| { session: null; user: null };
