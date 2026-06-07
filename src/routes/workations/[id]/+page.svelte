<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.workation.name} · Mitglieder</title>
</svelte:head>

<div class="card">
	<h2>Mitglieder</h2>
	<ul class="members">
		{#each data.members as m, i (m.memberId)}
			<li in:fly={{ y: 10, duration: 350, delay: 40 * i, easing: cubicOut }}>
				<span class="who">
					<span class="avatar" aria-hidden="true">{m.username.slice(0, 1).toUpperCase()}</span>
					<span class="uname">{m.username}</span>
					{#if m.userId === data.workation.createdById}<span class="pill coral">Ersteller</span>{/if}
					{#if m.status === 'invited'}<span class="pill amber">eingeladen</span>{/if}
					{#if m.status === 'declined'}<span class="pill danger">abgelehnt</span>{/if}
				</span>
				{#if data.isManager && m.userId !== data.workation.createdById}
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="memberId" value={m.memberId} />
						<button class="ghost remove" type="submit">Entfernen</button>
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
				<p class="success">„{form.invited}" wurde eingeladen ✓</p>
			{/if}
		</form>
	{/if}
</div>

<style>
	.members {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		flex-direction: column;
	}
	.members li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--line);
	}
	.members li:last-child {
		border-bottom: none;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-weight: 700;
		font-size: 0.85rem;
		color: #08201c;
		background: linear-gradient(135deg, var(--aqua), var(--amber));
		flex-shrink: 0;
	}
	.uname {
		font-weight: 600;
	}
	.invite {
		border-top: 1px solid var(--line);
		padding-top: 1.2rem;
		margin-top: 0.5rem;
	}
	.invite-row {
		display: flex;
		gap: 0.5rem;
	}
	.invite-row input {
		flex: 1;
	}
	.remove {
		color: var(--danger);
		font-size: 0.85rem;
		font-weight: 600;
	}
	.remove:hover {
		color: var(--danger);
		filter: brightness(1.25);
	}
</style>
