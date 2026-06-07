<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Paperclip, Receipt, CheckCheck, ExternalLink, Trash2, X } from '@lucide/svelte';
	import { formatMoney } from '$lib/format';
	import { paypalMeLink } from '$lib/money';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let base = $derived(`/workations/${data.workation.id}`);

	// --- Clientseitige Beleg-Komprimierung -------------------------------------
	let receiptBlob = $state<Blob | null>(null);
	let previewUrl = $state<string | null>(null);
	let compressing = $state(false);
	let compressError = $state<string | null>(null);

	/** Skaliert ein Bild auf max. 1280px Kantenlänge und exportiert es als JPEG. */
	async function compressImage(file: File): Promise<Blob> {
		const bitmap = await createImageBitmap(file);
		const maxEdge = 1280;
		const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
		const w = Math.round(bitmap.width * scale);
		const h = Math.round(bitmap.height * scale);
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas nicht verfügbar.');
		ctx.drawImage(bitmap, 0, 0, w, h);
		bitmap.close();
		return await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('Komprimierung fehlgeschlagen.'))),
				'image/jpeg',
				0.7
			);
		});
	}

	async function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		resetReceipt();
		if (!file) return;
		compressing = true;
		try {
			receiptBlob = await compressImage(file);
			previewUrl = URL.createObjectURL(receiptBlob);
		} catch {
			compressError = 'Bild konnte nicht verarbeitet werden.';
		} finally {
			compressing = false;
		}
	}

	function resetReceipt() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		receiptBlob = null;
		compressError = null;
	}

	let kb = $derived(receiptBlob ? Math.round(receiptBlob.size / 1024) : 0);
</script>

<svelte:head>
	<title>{data.workation.name} · Ausgaben</title>
</svelte:head>

<!-- Schuldenübersicht -->
<section class="card balances">
	<h2>Salden</h2>
	{#if data.balances.length === 0}
		<p class="muted ok"><CheckCheck size={18} /> Alles ausgeglichen — keine offenen Beträge.</p>
	{:else}
		<ul class="balance-list">
			{#each data.balances as b, i (b.user.id)}
				<li
					class="balance"
					class:owe={b.net > 0}
					in:fly={{ y: 10, duration: 350, delay: 40 * i, easing: cubicOut }}
				>
					<span class="avatar" aria-hidden="true">{b.user.username.slice(0, 1).toUpperCase()}</span>
					<div class="bal-body">
						<span class="bal-name">{b.user.username}</span>
						<span class="bal-dir">{b.net > 0 ? 'du schuldest' : 'schuldet dir'}</span>
					</div>
					<span class="bal-amount">{formatMoney(Math.abs(b.net))}</span>
					{#if b.net > 0}
						{#if b.user.paypalHandle}
							<a
								class="btn pay"
								href={paypalMeLink(b.user.paypalHandle, b.net)}
								target="_blank"
								rel="noopener"
							>
								PayPal <ExternalLink size={14} />
							</a>
						{:else}
							<span class="pill">kein PayPal</span>
						{/if}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- Neue Ausgabe -->
<form
	class="card add"
	method="POST"
	action="?/add"
	enctype="multipart/form-data"
	use:enhance={({ formData }) => {
		if (receiptBlob) formData.set('receipt', receiptBlob, 'receipt.jpg');
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') resetReceipt();
		};
	}}
>
	<h2>Neue Ausgabe</h2>

	<div class="row">
		<label class="grow">
			Beschreibung
			<input name="description" placeholder="z. B. Einkauf Supermarkt" maxlength="200" />
		</label>
		<label class="amount-field">
			Betrag (€)
			<input name="amount" type="number" step="0.01" min="0.01" placeholder="0,00" />
		</label>
	</div>

	<fieldset>
		<legend>Aufteilen auf</legend>
		<div class="chips">
			{#each data.members as m (m.id)}
				<label class="chip">
					<input type="checkbox" name="participants" value={m.id} checked />
					<span>{m.username}{#if m.id === data.currentUserId} (du){/if}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="receipt-field">
		<label class="file-btn">
			<input type="file" accept="image/*" onchange={onFileChange} />
			<Paperclip size={16} /> Beleg anhängen
		</label>
		{#if compressing}
			<span class="muted faint small">Bild wird komprimiert …</span>
		{:else if previewUrl}
			<div class="preview">
				<img src={previewUrl} alt="Beleg-Vorschau" />
				<span class="muted faint small">komprimiert · {kb} KB</span>
				<button type="button" class="ghost" onclick={resetReceipt} title="Entfernen"><X size={16} /></button>
			</div>
		{/if}
	</div>
	{#if compressError}<p class="error">{compressError}</p>{/if}

	{#if form?.message}
		<p class="error">{form.message}</p>
	{:else if form?.added}
		<p class="success">Ausgabe gespeichert ✓</p>
	{/if}

	<div>
		<button disabled={compressing}>Ausgabe hinzufügen</button>
	</div>
</form>

<!-- Liste -->
<section class="block">
	<h2>Verlauf</h2>
	{#if data.expenses.length === 0}
		<p class="muted">Noch keine Ausgaben erfasst.</p>
	{:else}
		<ul class="expenses">
			{#each data.expenses as e, i (e.id)}
				<li
					class="card expense"
					in:fly={{ y: 12, duration: 380, delay: 35 * i, easing: cubicOut }}
				>
					{#if e.hasReceipt}
						<a class="receipt" href="{base}/expenses/{e.id}/receipt" target="_blank" rel="noopener">
							<img src="{base}/expenses/{e.id}/receipt" alt="Beleg" />
						</a>
					{:else}
						<span class="receipt placeholder" aria-hidden="true"><Receipt size={20} /></span>
					{/if}
					<div class="info">
						<div class="line">
							<strong>{e.description}</strong>
							<span class="amount">{formatMoney(e.amountCents, e.currency)}</span>
						</div>
						<div class="muted faint small">
							{e.paidById === data.currentUserId ? 'du hast bezahlt' : `${e.paidByName} hat bezahlt`}
							· {new Date(e.createdAt).toLocaleDateString('de-DE')}
							{#if e.myShare != null}· dein Anteil {formatMoney(e.myShare)}{/if}
						</div>
					</div>
					{#if e.paidById === data.currentUserId || data.isManager}
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="expenseId" value={e.id} />
							<button class="ghost del" title="Löschen"><Trash2 size={16} /></button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.block,
	.add {
		margin-bottom: 1.6rem;
	}
	.balances {
		margin-bottom: 1.6rem;
	}

	/* Salden */
	.balance-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.balance {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.7rem 0.9rem;
		border-radius: var(--radius-sm);
		background: rgba(79, 224, 196, 0.07);
		border-left: 3px solid var(--aqua);
	}
	.balance.owe {
		background: rgba(255, 138, 92, 0.08);
		border-left-color: var(--coral);
	}
	.avatar {
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-weight: 700;
		color: #08201c;
		background: linear-gradient(135deg, var(--aqua), var(--amber));
		flex-shrink: 0;
	}
	.bal-body {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}
	.bal-name {
		font-weight: 600;
	}
	.bal-dir {
		font-size: 0.78rem;
		color: var(--ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.bal-amount {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.pay {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.ok {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	/* Formular */
	.add {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.row {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.grow {
		flex: 2;
		min-width: 12rem;
	}
	.amount-field {
		flex: 1;
		min-width: 7rem;
	}
	fieldset {
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0.8rem;
		margin: 0;
	}
	legend {
		color: var(--ink-soft);
		font-size: 0.8rem;
		font-weight: 500;
		padding: 0 0.4rem;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.chip {
		cursor: pointer;
	}
	.chip input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.chip span {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		border: 1px solid var(--glass-brd);
		background: var(--glass);
		font-size: 0.85rem;
		color: var(--ink-soft);
		transition: all 0.2s var(--ease);
	}
	.chip:has(input:checked) span {
		background: rgba(79, 224, 196, 0.16);
		border-color: rgba(79, 224, 196, 0.5);
		color: var(--aqua);
		font-weight: 600;
	}
	.chip input:focus-visible + span {
		box-shadow: 0 0 0 3px rgba(255, 138, 92, 0.3);
	}

	/* Beleg */
	.receipt-field {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.file-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.9rem;
		border-radius: var(--radius-sm);
		border: 1px dashed var(--glass-brd);
		background: var(--glass);
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--ink-soft);
		transition: all 0.2s var(--ease);
	}
	.file-btn:hover {
		border-color: var(--coral);
		color: var(--ink);
	}
	.file-btn input {
		display: none;
	}
	.preview {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.preview img {
		max-height: 64px;
		border-radius: 8px;
		border: 1px solid var(--glass-brd);
	}
	.small {
		font-size: 0.78rem;
	}

	/* Liste */
	.expenses {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.expense {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.1rem;
	}
	.receipt {
		flex-shrink: 0;
	}
	.receipt img {
		height: 48px;
		width: 48px;
		object-fit: cover;
		border-radius: 10px;
		border: 1px solid var(--glass-brd);
		display: block;
	}
	.receipt.placeholder {
		height: 48px;
		width: 48px;
		display: grid;
		place-items: center;
		font-size: 1.4rem;
		border-radius: 10px;
		background: var(--glass);
		border: 1px solid var(--line);
		opacity: 0.6;
	}
	.info {
		flex: 1;
		min-width: 0;
	}
	.line {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.amount {
		font-family: var(--font-display);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.del {
		color: var(--ink-faint);
		font-size: 1.2rem;
		line-height: 1;
	}
	.del:hover {
		color: var(--danger);
	}
</style>
