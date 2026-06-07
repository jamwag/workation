<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Neue Workation</title>
</svelte:head>

<h1>Neue Workation</h1>

<div class="card">
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
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 28rem;
	}
	.dates {
		display: flex;
		gap: 0.75rem;
	}
	.dates label {
		flex: 1;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
</style>
