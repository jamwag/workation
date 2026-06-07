import { requireWorkationAccess } from '$lib/server/workations';
import type { LayoutServerLoad } from './$types';

// Schützt alle Unterseiten einer Workation und stellt sie + die Manager-Rolle bereit.
export const load: LayoutServerLoad = async (event) => {
	const { workation, isManager } = await requireWorkationAccess(event, event.params.id);
	return { workation, isManager };
};
