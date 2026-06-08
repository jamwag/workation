import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Beim Öffnen einer Workation direkt zum Tagesplan (erster Tab).
export const load: PageServerLoad = (event) => {
	redirect(307, `/workations/${event.params.id}/schedule`);
};
