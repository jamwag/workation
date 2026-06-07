import type { LayoutServerLoad } from './$types';

// Stellt den angemeldeten Nutzer (inkl. Rolle) für die Navigation in allen Seiten bereit.
export const load: LayoutServerLoad = async (event) => {
	return { user: event.locals.user };
};
