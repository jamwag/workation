import { error, redirect, type RequestEvent } from '@sveltejs/kit';

/** Stellt sicher, dass ein Nutzer angemeldet ist; leitet sonst zur Anmeldung um. */
export function requireLogin(event: RequestEvent) {
	if (!event.locals.user) {
		redirect(302, '/login');
	}
	return event.locals.user;
}

/** Stellt sicher, dass ein angemeldeter Nutzer die globale Admin-Rolle hat. */
export function requireAdmin(event: RequestEvent) {
	const user = requireLogin(event);
	if (user.role !== 'admin') {
		error(403, 'Diese Aktion ist nur für Admins.');
	}
	return user;
}
