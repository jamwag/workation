<script lang="ts">
	import { enhance } from '$app/forms';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header>
		<nav>
			<a class="brand" href="/">🏝️ Workation</a>

			{#if data.user}
				<div class="links">
					<a href="/workations">Workations</a>
					<a href="/settings">Einstellungen</a>
				</div>
				<div class="user">
					<span class="who">
						{data.user.username}
						{#if data.user.role === 'admin'}<span class="badge">Admin</span>{/if}
					</span>
					<form method="POST" action="/logout" use:enhance>
						<button class="secondary">Abmelden</button>
					</form>
				</div>
			{:else}
				<a href="/login">Anmelden</a>
			{/if}
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	nav {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	.links {
		display: flex;
		gap: 1rem;
	}

	.links a {
		text-decoration: none;
		color: var(--muted);
	}

	.links a:hover {
		color: var(--text);
	}

	.user {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.who {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9rem;
	}

	.badge {
		background: var(--primary);
		color: var(--primary-text);
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
	}

	main {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}
</style>
