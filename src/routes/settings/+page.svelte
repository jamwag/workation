<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let handle = $derived(form?.paypalHandle ?? data.profile.paypalHandle ?? '');
</script>

<svelte:head>
	<title>Einstellungen · Workation</title>
</svelte:head>

<section class="head reveal">
	<p class="eyebrow">Profil</p>
	<h1>Einstellungen</h1>
</section>

<div class="card reveal-1">
	<div class="who">
		<div>
			<div class="name">{data.profile.username}</div>
			<span class="muted faint">Angemeldetes Konto</span>
		</div>
		<span class="pill" class:coral={data.profile.role === 'admin'}>
			{data.profile.role === 'admin' ? 'Admin' : 'Mitglied'}
		</span>
	</div>

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
		<p class="hint faint">
			Damit andere dir offene Beträge per PayPal schicken können. Zu finden unter paypal.me.
		</p>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{:else if form?.success}
			<p class="success">Gespeichert ✓</p>
		{/if}

		<div>
			<button>Speichern</button>
		</div>
	</form>
</div>

<style>
	.head {
		margin-bottom: 1.5rem;
	}
	.card {
		max-width: 30rem;
	}
	.who {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1.2rem;
		margin-bottom: 1.2rem;
		border-bottom: 1px solid var(--line);
	}
	.name {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 560;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.hint {
		font-size: 0.8rem;
		margin: 0;
	}
</style>
