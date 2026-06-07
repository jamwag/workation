<script lang="ts">
	import { Plane, Wallet, ArrowRight } from '@lucide/svelte';
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
		<span class="ico coral"><Plane size={22} /></span>
		<h2>Workations</h2>
		<p class="muted">Aufenthalte ansehen, Tagespläne &amp; Ausgaben verwalten.</p>
		<span class="go">Öffnen <ArrowRight size={16} /></span>
	</a>
	<a class="card interactive tile reveal-2" href="/settings">
		<span class="ico aqua"><Wallet size={22} /></span>
		<h2>Einstellungen</h2>
		<p class="muted">PayPal-Benutzernamen hinterlegen.</p>
		<span class="go">Öffnen <ArrowRight size={16} /></span>
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
		margin: 0.5rem 0 0;
	}
	.ico {
		display: inline-flex;
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 14px;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--glass-brd);
	}
	.ico.coral {
		color: var(--coral);
		background: rgba(255, 138, 92, 0.12);
	}
	.ico.aqua {
		color: var(--aqua);
		background: rgba(79, 224, 196, 0.12);
	}
	.go {
		margin-top: 0.9rem;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-weight: 600;
		color: var(--aqua);
		transition: gap 0.25s var(--ease);
	}
	.tile:hover .go {
		gap: 0.6rem;
		color: var(--coral);
	}
</style>
