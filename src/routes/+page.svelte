<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Start</title>
</svelte:head>

<h1>Hallo, {data.user.username}! 👋</h1>
<p class="muted">Plane Workations, teile Ausgaben und behalte den Überblick.</p>

<div class="grid">
	<a class="card tile" href="/workations">
		<h2>Workations</h2>
		<p class="muted">Aufenthalte ansehen, Tagespläne & Ausgaben verwalten.</p>
	</a>
	<a class="card tile" href="/settings">
		<h2>Einstellungen</h2>
		<p class="muted">PayPal.me-Benutzernamen hinterlegen.</p>
	</a>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.tile {
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s;
	}

	.tile:hover {
		border-color: var(--primary);
	}

	.tile h2 {
		color: var(--text);
	}
</style>
