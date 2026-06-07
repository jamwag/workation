<script lang="ts">
	import { enhance } from '$app/forms';
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
	<h2>Wer schuldet wem</h2>
	{#if data.balances.length === 0}
		<p class="muted">Aktuell sind keine Beträge offen.</p>
	{:else}
		<ul>
			{#each data.balances as b (b.user.id)}
				<li>
					{#if b.net > 0}
						<span>
							Du schuldest <strong>{b.user.username}</strong>
							<strong>{formatMoney(b.net)}</strong>
						</span>
						{#if b.user.paypalHandle}
							<a class="pay" href={paypalMeLink(b.user.paypalHandle, b.net)} target="_blank" rel="noopener">
								Mit PayPal zahlen →
							</a>
						{:else}
							<span class="muted small">(kein PayPal hinterlegt)</span>
						{/if}
					{:else}
						<span>
							<strong>{b.user.username}</strong> schuldet dir
							<strong>{formatMoney(-b.net)}</strong>
						</span>
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
		<label>
			Betrag (€)
			<input name="amount" type="number" step="0.01" min="0.01" placeholder="0,00" />
		</label>
	</div>

	<fieldset>
		<legend>Aufteilen auf</legend>
		<div class="participants">
			{#each data.members as m (m.id)}
				<label class="check">
					<input type="checkbox" name="participants" value={m.id} checked />
					{m.username}{#if m.id === data.currentUserId} (du){/if}
				</label>
			{/each}
		</div>
	</fieldset>

	<label>
		Beleg (optional)
		<input type="file" accept="image/*" onchange={onFileChange} />
	</label>
	{#if compressing}
		<p class="muted small">Bild wird komprimiert …</p>
	{:else if previewUrl}
		<div class="preview">
			<img src={previewUrl} alt="Beleg-Vorschau" />
			<span class="muted small">komprimiert · {kb} KB</span>
		</div>
	{/if}
	{#if compressError}<p class="error">{compressError}</p>{/if}

	{#if form?.message}
		<p class="error">{form.message}</p>
	{:else if form?.added}
		<p class="success">Ausgabe gespeichert.</p>
	{/if}

	<div>
		<button disabled={compressing}>Ausgabe hinzufügen</button>
	</div>
</form>

<!-- Liste -->
<section>
	<h2>Ausgaben</h2>
	{#if data.expenses.length === 0}
		<p class="muted">Noch keine Ausgaben erfasst.</p>
	{:else}
		<ul class="expenses">
			{#each data.expenses as e (e.id)}
				<li class="card expense">
					<div class="info">
						<div class="line">
							<strong>{e.description}</strong>
							<span class="amount">{formatMoney(e.amountCents, e.currency)}</span>
						</div>
						<div class="muted small">
							bezahlt von {e.paidById === data.currentUserId ? 'dir' : e.paidByName}
							· {new Date(e.createdAt).toLocaleDateString('de-DE')}
							{#if e.myShare != null}· dein Anteil {formatMoney(e.myShare)}{/if}
						</div>
					</div>
					{#if e.hasReceipt}
						<a class="receipt" href="{base}/expenses/{e.id}/receipt" target="_blank" rel="noopener">
							<img src="{base}/expenses/{e.id}/receipt" alt="Beleg" />
						</a>
					{/if}
					{#if e.paidById === data.currentUserId || data.isManager}
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="expenseId" value={e.id} />
							<button class="link-danger" title="Löschen">×</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	section,
	.add {
		margin-bottom: 1.5rem;
	}
	.balances ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.balances li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.pay {
		font-weight: 500;
		white-space: nowrap;
	}
	.add {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.row {
		display: flex;
		gap: 0.75rem;
	}
	.grow {
		flex: 1;
	}
	fieldset {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem 0.8rem;
	}
	legend {
		color: var(--muted);
		font-size: 0.9rem;
		padding: 0 0.3rem;
	}
	.participants {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
	}
	.check {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
		color: var(--text);
	}
	.check input {
		width: auto;
	}
	.preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.preview img {
		max-height: 80px;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.small {
		font-size: 0.8rem;
	}
	.expenses {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.expense {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.info {
		flex: 1;
	}
	.line {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.amount {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		white-space: nowrap;
	}
	.receipt img {
		height: 48px;
		width: 48px;
		object-fit: cover;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.link-danger {
		background: none;
		border: none;
		color: var(--danger);
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
		padding: 0 0.3rem;
	}
</style>
