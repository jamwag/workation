import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireLogin } from '$lib/server/auth-guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const sessionUser = requireLogin(event);
	const [profile] = await db
		.select({
			username: table.user.username,
			role: table.user.role,
			paypalHandle: table.user.paypalHandle
		})
		.from(table.user)
		.where(eq(table.user.id, sessionUser.id));
	return { profile };
};

export const actions: Actions = {
	default: async (event) => {
		const sessionUser = requireLogin(event);
		const formData = await event.request.formData();
		const raw = formData.get('paypalHandle');
		const paypalHandle = typeof raw === 'string' ? raw.trim() : '';

		if (paypalHandle.length > 100) {
			return fail(400, { message: 'Der PayPal.me-Benutzername ist zu lang.', paypalHandle });
		}
		// Optionales Feld: leer = entfernen. Nur unkritische Zeichen zulassen.
		if (paypalHandle && !/^[A-Za-z0-9_.@-]+$/.test(paypalHandle)) {
			return fail(400, {
				message: 'Bitte nur Buchstaben, Zahlen und . _ - @ verwenden.',
				paypalHandle
			});
		}

		await db
			.update(table.user)
			.set({ paypalHandle: paypalHandle || null })
			.where(eq(table.user.id, sessionUser.id));

		return { success: true, paypalHandle };
	}
};
