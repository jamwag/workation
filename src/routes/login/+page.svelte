<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Anmelden · Workation</title>
</svelte:head>

<div class="auth">
	<div class="card auth-card reveal">
		<p class="eyebrow">Willkommen an Bord</p>
		<h1>Schön, dich zu sehen.</h1>
		<p class="muted intro">
			Melde dich an oder erstelle ein Konto, um deine Workations zu planen.
		</p>

		<form method="POST" use:enhance>
			<label>
				Benutzername
				<input name="username" autocomplete="username" placeholder="benutzername" />
			</label>
			<label>
				Passwort
				<input type="password" name="password" autocomplete="current-password" placeholder="••••••••" />
			</label>

			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}

			<div class="actions">
				<button formaction="?/login">Anmelden</button>
				<button class="secondary" formaction="?/register">Registrieren</button>
			</div>
		</form>
	</div>
</div>

<style>
	.auth {
		min-height: 62vh;
		display: grid;
		place-items: center;
	}
	.auth-card {
		width: 100%;
		max-width: 27rem;
		padding: 2.4rem;
	}
	.intro {
		margin-bottom: 1.6rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}
	.actions button {
		flex: 1;
	}
</style>
