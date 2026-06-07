import { requireLogin } from '$lib/server/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireLogin(event);
	return { user };
};
