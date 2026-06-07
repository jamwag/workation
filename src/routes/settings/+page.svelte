<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Vom Server validierter Wert nach Absenden, sonst der gespeicherte Wert.
	let handle = $derived(form?.paypalHandle ?? data.profile.paypalHandle ?? '');
</script>

<svelte:head>
	<title>Einstellungen</title>
</svelte:head>

<h1>Einstellungen</h1>

<div class="card">
	<p class="muted">
		Angemeldet als <strong>{data.profile.username}</strong> · Rolle:
		<strong>{data.profile.role === 'admin' ? 'Admin' : 'Mitglied'}</strong>
	</p>

	<form method="POST" use:enhance>
		<label>
			PayPal.me-Benutzername
			<input
				name="paypalHandle"
				value={handle}
				placeholder="z. B. maxmustermann"
				autocomplete="off"
			/>
		</label>
		<p class="hint muted">
			Nötig, damit andere dir offene Beträge per PayPal schicken können. Du findest deinen
			Benutzernamen unter paypal.me.
		</p>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{:else if form?.success}
			<p class="success">Gespeichert.</p>
		{/if}

		<div>
			<button>Speichern</button>
		</div>
	</form>
</div>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 24rem;
		margin-top: 1rem;
	}

	.hint {
		font-size: 0.8rem;
		margin: 0;
	}
</style>
