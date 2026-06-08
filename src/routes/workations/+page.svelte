<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { formatDateRange } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Workations</title>
</svelte:head>

<section class="head reveal">
	<div>
		<p class="eyebrow">Deine Reisen</p>
		<h1>Workations</h1>
	</div>
	{#if data.isAdmin}
		<a class="btn" href="/workations/new">+ Neue Workation</a>
	{/if}
</section>

{#if data.invitations.length > 0}
	<section class="block">
		<h2>Offene Einladungen</h2>
		<ul class="list">
			{#each data.invitations as inv, i (inv.memberId)}
				<li class="card row" in:fly={{ y: 14, duration: 400, delay: 60 * i, easing: cubicOut }}>
					<div>
						<strong class="title">{inv.workation.name}</strong>
						<div class="muted faint">
							{formatDateRange(inv.workation.startDate, inv.workation.endDate)}
						</div>
					</div>
					<div class="actions">
						<form method="POST" action="?/accept" use:enhance>
							<input type="hidden" name="memberId" value={inv.memberId} />
							<button>Annehmen</button>
						</form>
						<form method="POST" action="?/decline" use:enhance>
							<input type="hidden" name="memberId" value={inv.memberId} />
							<button class="secondary">Ablehnen</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="block">
	<h2>Meine Workations</h2>
	{#if data.active.length === 0}
		<div class="card empty reveal-2">
			<p class="muted">
				Noch keine Workations.
				{data.isAdmin ? 'Lege oben deine erste an.' : 'Warte auf eine Einladung.'}
			</p>
		</div>
	{:else}
		<ul class="grid">
			{#each data.active as m, i (m.memberId)}
				<li in:fly={{ y: 16, duration: 450, delay: 60 * i, easing: cubicOut }}>
					<a class="card interactive tile" href="/workations/{m.workation.id}/schedule">
						<strong class="title">{m.workation.name}</strong>
						<div class="muted faint">
							{formatDateRange(m.workation.startDate, m.workation.endDate)}
						</div>
						<span class="go">Öffnen →</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.head h1 {
		margin: 0;
	}
	.block {
		margin-bottom: 2rem;
	}
	.title {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 560;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 1.1rem;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-decoration: none;
		color: inherit;
		height: 100%;
	}
	.go {
		margin-top: 1rem;
		font-weight: 600;
		color: var(--aqua);
		transition: transform 0.25s var(--ease);
	}
	.tile:hover .go {
		transform: translateX(4px);
		color: var(--coral);
	}
	.empty {
		padding: 2rem;
		text-align: center;
	}
</style>
