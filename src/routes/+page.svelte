<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Start · Workation</title>
</svelte:head>

<section class="hero reveal">
	<p class="eyebrow">Dein Basislager</p>
	<h1>Hallo, {data.user.username}.</h1>
	<p class="muted lede">
		Plane Aufenthalte, stimme Tagespläne ab und teile Ausgaben — alles an einem Ort.
	</p>
</section>

<div class="grid">
	<a class="card interactive tile reveal-1" href="/workations">
		<span class="ico" aria-hidden="true">🏝️</span>
		<h2>Workations</h2>
		<p class="muted">Aufenthalte ansehen, Tagespläne &amp; Ausgaben verwalten.</p>
		<span class="go">Öffnen →</span>
	</a>
	<a class="card interactive tile reveal-2" href="/settings">
		<span class="ico" aria-hidden="true">💸</span>
		<h2>Einstellungen</h2>
		<p class="muted">PayPal-Benutzernamen hinterlegen.</p>
		<span class="go">Öffnen →</span>
	</a>
</div>

<style>
	.hero {
		margin-bottom: 2rem;
	}
	.lede {
		font-size: 1.05rem;
		max-width: 34rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1.1rem;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		text-decoration: none;
		color: inherit;
	}
	.tile h2 {
		margin: 0.3rem 0 0;
	}
	.ico {
		font-size: 1.8rem;
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
	}
	.go {
		margin-top: 0.8rem;
		font-weight: 600;
		color: var(--aqua);
		transition: transform 0.25s var(--ease);
	}
	.tile:hover .go {
		transform: translateX(4px);
		color: var(--coral);
	}
</style>
