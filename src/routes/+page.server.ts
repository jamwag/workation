import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireLogin } from '$lib/server/auth-guard';
import { daysBetweenISO, todayISO } from '$lib/calendar';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireLogin(event);
	const today = todayISO();

	// Akzeptierte Workations des Nutzers.
	const memberships = await db
		.select({ workation: table.workation })
		.from(table.workationMember)
		.innerJoin(table.workation, eq(table.workationMember.workationId, table.workation.id))
		.where(
			and(eq(table.workationMember.userId, user.id), eq(table.workationMember.status, 'accepted'))
		)
		.orderBy(asc(table.workation.startDate));

	const workations = memberships.map((m) => m.workation);
	const running = workations.filter((w) => w.startDate <= today && today <= w.endDate);
	const upcoming = workations.filter((w) => w.startDate > today);

	// Heutige Tagesplan-Einträge der laufenden Workations (eine Abfrage).
	const runningIds = running.map((w) => w.id);
	const todaysEntries =
		runningIds.length > 0
			? await db
					.select()
					.from(table.scheduleEntry)
					.where(
						and(
							inArray(table.scheduleEntry.workationId, runningIds),
							eq(table.scheduleEntry.day, today)
						)
					)
					.orderBy(asc(table.scheduleEntry.startTime))
			: [];

	const current = running.map((w) => {
		const totalDays = daysBetweenISO(w.startDate, w.endDate) + 1;
		const dayNumber = daysBetweenISO(w.startDate, today) + 1;
		return {
			workation: w,
			dayNumber,
			totalDays,
			daysLeft: daysBetweenISO(today, w.endDate),
			todayEntries: todaysEntries.filter((e) => e.workationId === w.id)
		};
	});

	const next = upcoming.map((w) => ({
		workation: w,
		startsInDays: daysBetweenISO(today, w.startDate)
	}));

	return { user, current, upcoming: next, hasAny: workations.length > 0 };
};
