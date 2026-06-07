<script lang="ts">
	import { page } from '$app/state';
	import { formatDateRange } from '$lib/format';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let base = $derived(`/workations/${data.workation.id}`);
	let path = $derived(page.url.pathname);
</script>

<div class="head">
	<div>
		<h1>{data.workation.name}</h1>
		<p class="muted">{formatDateRange(data.workation.startDate, data.workation.endDate)}</p>
	</div>
	<a href="/workations">← Übersicht</a>
</div>

<nav class="tabs">
	<a href={base} class:active={path === base}>Mitglieder</a>
	<a href="{base}/schedule" class:active={path === `${base}/schedule`}>Tagesplan</a>
	<a href="{base}/expenses" class:active={path.startsWith(`${base}/expenses`)}>Ausgaben</a>
</nav>

{@render children()}

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.head h1 {
		margin-bottom: 0.25rem;
	}
	.head p {
		margin: 0;
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--border);
		margin: 1rem 0 1.5rem;
	}
	.tabs a {
		padding: 0.5rem 0.9rem;
		text-decoration: none;
		color: var(--muted);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	.tabs a.active {
		color: var(--text);
		border-bottom-color: var(--primary);
		font-weight: 500;
	}
</style>
