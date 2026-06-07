import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Ungültiger Benutzername (3–31 Zeichen: a–z, 0–9, _ oder -)' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Ungültiges Passwort (6–255 Zeichen)' });
		}

		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username));

		// Identische Fehlermeldung für "User existiert nicht" und "Passwort falsch",
		// damit kein Rückschluss auf vorhandene Benutzernamen möglich ist.
		if (!existingUser) {
			return fail(400, { message: 'Benutzername oder Passwort ist falsch' });
		}

		const validPassword = await auth.verifyPassword(existingUser.passwordHash, password);
		if (!validPassword) {
			return fail(400, { message: 'Benutzername oder Passwort ist falsch' });
		}

		const token = auth.generateSessionToken();
		const session = await auth.createSession(token, existingUser.id);
		auth.setSessionTokenCookie(event, token, session.expiresAt);

		return redirect(302, '/');
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Ungültiger Benutzername (3–31 Zeichen: a–z, 0–9, _ oder -)' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Ungültiges Passwort (6–255 Zeichen)' });
		}

		const passwordHash = await auth.hashPassword(password);
		const userId = auth.generateUserId();

		// Insert separat absichern: der unique-Constraint auf username wirft bei Dubletten.
		// Wichtig: redirect() steht AUSSERHALB des try/catch, sonst würde es fälschlich gefangen.
		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash });
		} catch {
			return fail(400, { message: 'Benutzername ist bereits vergeben' });
		}

		const token = auth.generateSessionToken();
		const session = await auth.createSession(token, userId);
		auth.setSessionTokenCookie(event, token, session.expiresAt);

		return redirect(302, '/');
	}
};

function validateUsername(username: unknown): username is string {
	return typeof username === 'string' && /^[a-z0-9_-]{3,31}$/.test(username);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
