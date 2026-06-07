<script lang="ts">
	import { page } from '$app/state';
	import { formatDateRange } from '$lib/format';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let base = $derived(`/workations/${data.workation.id}`);
	let path = $derived(page.url.pathname);

	let tabs = $derived([
		{ href: base, label: 'Mitglieder', active: path === base },
		{ href: `${base}/schedule`, label: 'Tagesplan', active: path === `${base}/schedule` },
		{ href: `${base}/expenses`, label: 'Ausgaben', active: path.startsWith(`${base}/expenses`) }
	]);
</script>

<section class="head reveal">
	<div>
		<a class="back" href="/workations">← Alle Workations</a>
		<h1>{data.workation.name}</h1>
		<span class="pill aqua">{formatDateRange(data.workation.startDate, data.workation.endDate)}</span>
	</div>
</section>

<nav class="tabs reveal-1">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class:active={tab.active}>{tab.label}</a>
	{/each}
</nav>

<div class="content reveal-2">
	{@render children()}
</div>

<style>
	.head {
		margin-bottom: 1.3rem;
	}
	.back {
		display: inline-block;
		font-size: 0.85rem;
		color: var(--ink-soft);
		margin-bottom: 0.6rem;
	}
	.head h1 {
		margin: 0 0 0.6rem;
	}
	.tabs {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.3rem;
		margin-bottom: 1.6rem;
		background: var(--glass);
		border: 1px solid var(--glass-brd);
		border-radius: 999px;
		backdrop-filter: blur(16px) saturate(150%);
		-webkit-backdrop-filter: blur(16px) saturate(150%);
	}
	.tabs a {
		padding: 0.45rem 1.1rem;
		border-radius: 999px;
		color: var(--ink-soft);
		font-size: 0.9rem;
		font-weight: 600;
		transition:
			color 0.25s var(--ease),
			background 0.25s var(--ease);
	}
	.tabs a:hover {
		color: var(--ink);
	}
	.tabs a.active {
		color: #18120d;
		background: linear-gradient(135deg, var(--coral), var(--coral-deep));
		box-shadow: 0 6px 18px -8px rgba(255, 99, 71, 0.7);
	}
</style>
