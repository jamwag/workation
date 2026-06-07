<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Anmelden</title>
</svelte:head>

<h1>Anmelden oder Registrieren</h1>

<form method="POST" use:enhance>
	<label>
		Benutzername
		<input name="username" autocomplete="username" />
	</label>
	<label>
		Passwort
		<input type="password" name="password" autocomplete="current-password" />
	</label>

	{#if form?.message}
		<p class="error">{form.message}</p>
	{/if}

	<div class="actions">
		<button formaction="?/login">Anmelden</button>
		<button formaction="?/register">Registrieren</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 20rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.error {
		color: #d00;
		margin: 0;
	}
</style>
