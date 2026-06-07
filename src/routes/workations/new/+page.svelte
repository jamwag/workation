<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Neue Workation</title>
</svelte:head>

<section class="head reveal">
	<p class="eyebrow">Neuer Aufenthalt</p>
	<h1>Workation anlegen</h1>
</section>

<div class="card reveal-1">
	<form method="POST" use:enhance>
		<label>
			Name
			<input name="name" value={form?.values?.name ?? ''} placeholder="z. B. Lissabon Frühjahr" />
		</label>
		<div class="dates">
			<label>
				Von
				<input type="date" name="startDate" value={form?.values?.startDate ?? ''} />
			</label>
			<label>
				Bis
				<input type="date" name="endDate" value={form?.values?.endDate ?? ''} />
			</label>
		</div>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}

		<div class="actions">
			<button>Anlegen</button>
			<a href="/workations">Abbrechen</a>
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
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.dates {
		display: flex;
		gap: 0.8rem;
	}
	.dates label {
		flex: 1;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		margin-top: 0.4rem;
	}
</style>
