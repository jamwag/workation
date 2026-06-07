import { redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

// /logout ist nur per POST sinnvoll – direkter Aufruf leitet weiter.
export const load: PageServerLoad = async () => {
	redirect(302, '/');
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session) {
			await auth.invalidateSession(event.locals.session.id);
		}
		auth.deleteSessionTokenCookie(event);
		redirect(302, '/login');
	}
};
