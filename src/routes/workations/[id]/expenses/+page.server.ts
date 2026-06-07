import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { requireWorkationAccess } from '$lib/server/workations';
import { splitAmountCents } from '$lib/money';
import type { Actions, PageServerLoad } from './$types';

const MAX_RECEIPT_BYTES = 2_000_000; // Sicherheitsgrenze nach Client-Komprimierung

export const load: PageServerLoad = async (event) => {
	const { user } = await requireWorkationAccess(event, event.params.id);
	const workationId = event.params.id;

	const members = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			paypalHandle: table.user.paypalHandle
		})
		.from(table.workationMember)
		.innerJoin(table.user, eq(table.workationMember.userId, table.user.id))
		.where(
			and(
				eq(table.workationMember.workationId, workationId),
				eq(table.workationMember.status, 'accepted')
			)
		)
		.orderBy(table.user.username);

	const expenses = await db
		.select({
			id: table.expense.id,
			paidById: table.expense.paidById,
			paidByName: table.user.username,
			description: table.expense.description,
			amountCents: table.expense.amountCents,
			currency: table.expense.currency,
			receiptMimeType: table.expense.receiptMimeType,
			createdAt: table.expense.createdAt
		})
		.from(table.expense)
		.innerJoin(table.user, eq(table.expense.paidById, table.user.id))
		.where(eq(table.expense.workationId, workationId))
		.orderBy(desc(table.expense.createdAt));

	const shares = await db
		.select({
			expenseId: table.expenseShare.expenseId,
			userId: table.expenseShare.userId,
			amountCents: table.expenseShare.amountCents
		})
		.from(table.expenseShare)
		.innerJoin(table.expense, eq(table.expenseShare.expenseId, table.expense.id))
		.where(eq(table.expense.workationId, workationId));

	// Netto-Salden des aktuellen Nutzers gegenüber jeder anderen Person berechnen.
	const paidByOf = new Map(expenses.map((e) => [e.id, e.paidById]));
	const owedByMe = new Map<string, number>(); // ich schulde Person X
	const owedToMe = new Map<string, number>(); // Person X schuldet mir
	const myShareOf = new Map<string, number>(); // mein Anteil je Ausgabe

	for (const share of shares) {
		const payer = paidByOf.get(share.expenseId);
		if (!payer) continue;
		if (share.userId === user.id) {
			myShareOf.set(share.expenseId, share.amountCents);
			if (payer !== user.id) {
				owedByMe.set(payer, (owedByMe.get(payer) ?? 0) + share.amountCents);
			}
		} else if (payer === user.id) {
			owedToMe.set(share.userId, (owedToMe.get(share.userId) ?? 0) + share.amountCents);
		}
	}

	const balances = members
		.filter((m) => m.id !== user.id)
		.map((m) => ({
			user: m,
			// >0: ich schulde m, <0: m schuldet mir
			net: (owedByMe.get(m.id) ?? 0) - (owedToMe.get(m.id) ?? 0)
		}))
		.filter((b) => b.net !== 0);

	const expensesWithShare = expenses.map((e) => ({
		...e,
		hasReceipt: e.receiptMimeType != null,
		myShare: myShareOf.get(e.id) ?? null
	}));

	return { members, expenses: expensesWithShare, balances, currentUserId: user.id };
};

export const actions: Actions = {
	add: async (event) => {
		const { user } = await requireWorkationAccess(event, event.params.id);
		const workationId = event.params.id;
		const fd = await event.request.formData();

		const description = (fd.get('description') ?? '').toString().trim();
		const amountRaw = (fd.get('amount') ?? '').toString().replace(',', '.').trim();
		const participantIds = fd.getAll('participants').map((v) => v.toString());
		const receipt = fd.get('receipt');

		if (!description || description.length > 200) {
			return fail(400, { message: 'Bitte eine Beschreibung (max. 200 Zeichen) angeben.' });
		}
		const amount = Number(amountRaw);
		if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
			return fail(400, { message: 'Bitte einen gültigen Betrag größer 0 angeben.' });
		}
		const amountCents = Math.round(amount * 100);

		// Nur akzeptierte Mitglieder dürfen Teilnehmer sein.
		const accepted = await db
			.select({ id: table.workationMember.userId })
			.from(table.workationMember)
			.where(
				and(
					eq(table.workationMember.workationId, workationId),
					eq(table.workationMember.status, 'accepted')
				)
			);
		const acceptedIds = new Set(accepted.map((a) => a.id));
		const selected = [...new Set(participantIds)].filter((id) => acceptedIds.has(id));
		if (selected.length === 0) {
			return fail(400, { message: 'Bitte mindestens einen Teilnehmer auswählen.' });
		}

		// Beleg (bereits clientseitig komprimiert) verarbeiten.
		let receiptImage: Buffer | null = null;
		let receiptMimeType: string | null = null;
		if (receipt instanceof File && receipt.size > 0) {
			if (!receipt.type.startsWith('image/')) {
				return fail(400, { message: 'Der Beleg muss ein Bild sein.' });
			}
			if (receipt.size > MAX_RECEIPT_BYTES) {
				return fail(400, { message: 'Der Beleg ist zu groß (max. 2 MB).' });
			}
			receiptImage = Buffer.from(await receipt.arrayBuffer());
			receiptMimeType = receipt.type;
		}

		const amounts = splitAmountCents(amountCents, selected.length);

		await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(table.expense)
				.values({
					workationId,
					paidById: user.id,
					description,
					amountCents,
					currency: 'EUR',
					receiptImage,
					receiptMimeType
				})
				.returning({ id: table.expense.id });

			await tx.insert(table.expenseShare).values(
				selected.map((userId, i) => ({
					expenseId: created.id,
					userId,
					amountCents: amounts[i]
				}))
			);
		});

		return { added: true };
	},

	delete: async (event) => {
		const { user, isManager } = await requireWorkationAccess(event, event.params.id);
		const fd = await event.request.formData();
		const expenseId = (fd.get('expenseId') ?? '').toString();
		if (!expenseId) {
			return fail(400);
		}

		const [exp] = await db
			.select({ paidById: table.expense.paidById })
			.from(table.expense)
			.where(
				and(eq(table.expense.id, expenseId), eq(table.expense.workationId, event.params.id))
			);
		if (!exp) {
			return fail(404, { message: 'Ausgabe nicht gefunden.' });
		}
		// Nur der Zahler selbst oder der Workation-Manager darf löschen.
		if (exp.paidById !== user.id && !isManager) {
			error(403, 'Du darfst diese Ausgabe nicht löschen.');
		}

		// expense_share wird per FK-Cascade mitgelöscht.
		await db.delete(table.expense).where(eq(table.expense.id, expenseId));
		return { deleted: true };
	}
};
