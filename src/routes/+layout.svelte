<script lang="ts">
	import '@fontsource-variable/fraunces/full.css';
	import '@fontsource-variable/manrope/index.css';
	import '../app.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<header class="topbar">
	<nav>
		<a class="brand" href="/">
			<span class="dot" aria-hidden="true"></span>
			Workation
		</a>

		{#if data.user}
			<div class="links">
				<a href="/workations" class:active={page.url.pathname.startsWith('/workations')}>Workations</a>
				<a href="/settings" class:active={page.url.pathname === '/settings'}>Einstellungen</a>
			</div>
			<div class="user">
				<span class="pill" class:coral={data.user.role === 'admin'}>
					{data.user.username}{#if data.user.role === 'admin'} · Admin{/if}
				</span>
				<form method="POST" action="/logout" use:enhance>
					<button class="secondary">Abmelden</button>
				</form>
			</div>
		{:else}
			<a class="btn" href="/login">Anmelden</a>
		{/if}
	</nav>
</header>

{#key page.url.pathname}
	<main in:fly={{ y: 12, duration: 420, easing: cubicOut }}>
		{@render children()}
	</main>
{/key}

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(10, 20, 30, 0.55);
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		border-bottom: 1px solid var(--line);
	}

	nav {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 0.7rem 1.2rem;
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.15rem;
		color: var(--ink);
		letter-spacing: -0.01em;
	}

	.brand:hover {
		color: var(--ink);
	}

	.dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--coral), var(--amber));
		box-shadow: 0 0 14px 2px rgba(255, 138, 92, 0.7);
		animation: pulse 3.5s var(--ease) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 14px 2px rgba(255, 138, 92, 0.55);
		}
		50% {
			box-shadow: 0 0 20px 5px rgba(79, 224, 196, 0.6);
		}
	}

	.links {
		display: flex;
		gap: 0.4rem;
	}

	.links a {
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		color: var(--ink-soft);
		font-size: 0.92rem;
		font-weight: 500;
		transition:
			background 0.25s var(--ease),
			color 0.25s var(--ease);
	}

	.links a:hover {
		color: var(--ink);
		background: var(--glass);
	}

	.links a.active {
		color: var(--ink);
		background: var(--glass-2);
	}

	.user {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.user .pill {
		max-width: 14rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	main {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 2rem 1.2rem 4rem;
	}
</style>
