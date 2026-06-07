<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDateRange } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Workations</title>
</svelte:head>

<div class="head">
	<h1>Workations</h1>
	{#if data.isAdmin}
		<a class="btn" href="/workations/new">+ Neue Workation</a>
	{/if}
</div>

{#if data.invitations.length > 0}
	<section>
		<h2>Einladungen</h2>
		<ul class="list">
			{#each data.invitations as inv (inv.memberId)}
				<li class="card row">
					<div>
						<strong>{inv.workation.name}</strong>
						<div class="muted">{formatDateRange(inv.workation.startDate, inv.workation.endDate)}</div>
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

<section>
	<h2>Meine Workations</h2>
	{#if data.active.length === 0}
		<p class="muted">Noch keine Workations. {data.isAdmin ? 'Lege oben eine neue an.' : 'Warte auf eine Einladung.'}</p>
	{:else}
		<ul class="list">
			{#each data.active as m (m.memberId)}
				<li>
					<a class="card row tile" href="/workations/{m.workation.id}">
						<div>
							<strong>{m.workation.name}</strong>
							<div class="muted">{formatDateRange(m.workation.startDate, m.workation.endDate)}</div>
						</div>
						<span aria-hidden="true">→</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.btn {
		background: var(--primary);
		color: var(--primary-text);
		padding: 0.5rem 0.9rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		white-space: nowrap;
	}
	section {
		margin-top: 1.5rem;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.tile {
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s;
	}
	.tile:hover {
		border-color: var(--primary);
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
</style>
