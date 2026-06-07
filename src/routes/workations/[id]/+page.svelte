<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDateRange } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.workation.name}</title>
</svelte:head>

<div class="head">
	<div>
		<h1>{data.workation.name}</h1>
		<p class="muted">{formatDateRange(data.workation.startDate, data.workation.endDate)}</p>
	</div>
	<a href="/workations">← Übersicht</a>
</div>

<section class="card">
	<h2>Mitglieder</h2>
	<ul class="members">
		{#each data.members as m (m.memberId)}
			<li>
				<span>
					{m.username}
					{#if m.userId === data.workation.createdById}<span class="tag">Ersteller</span>{/if}
					{#if m.status === 'invited'}<span class="tag pending">eingeladen</span>{/if}
					{#if m.status === 'declined'}<span class="tag declined">abgelehnt</span>{/if}
				</span>
				{#if data.isManager && m.userId !== data.workation.createdById}
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="memberId" value={m.memberId} />
						<button class="link-danger" type="submit">Entfernen</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>

	{#if data.isManager}
		<form class="invite" method="POST" action="?/invite" use:enhance>
			<label>
				Mitglied einladen (Benutzername)
				<div class="invite-row">
					<input name="username" placeholder="benutzername" autocomplete="off" />
					<button>Einladen</button>
				</div>
			</label>
			{#if form?.message}
				<p class="error">{form.message}</p>
			{:else if form?.invited}
				<p class="success">„{form.invited}" wurde eingeladen.</p>
			{/if}
		</form>
	{/if}
</section>

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
	section {
		margin-top: 1.5rem;
	}
	.members {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.members li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--border);
	}
	.tag {
		font-size: 0.7rem;
		background: var(--border);
		color: var(--muted);
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		margin-left: 0.3rem;
	}
	.tag.pending {
		background: #fff3cd;
		color: #8a6d1c;
	}
	.tag.declined {
		background: #f8d7da;
		color: #842029;
	}
	.invite {
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}
	.invite-row {
		display: flex;
		gap: 0.5rem;
	}
	.invite-row input {
		flex: 1;
	}
	.link-danger {
		background: none;
		border: none;
		color: var(--danger);
		cursor: pointer;
		padding: 0;
		font-size: 0.85rem;
	}
	.link-danger:hover {
		text-decoration: underline;
	}
</style>
