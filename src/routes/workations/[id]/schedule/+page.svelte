<script lang="ts">
	import { enhance } from '$app/forms';
	import { eachDayISO, formatDate, formatDayLong, formatTime } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let days = $derived(eachDayISO(data.workation.startDate, data.workation.endDate));

	// Einträge nach Tag gruppieren (Reihenfolge kommt bereits sortiert vom Server).
	let byDay = $derived.by(() => {
		const grouped: Record<string, typeof data.entries> = {};
		for (const entry of data.entries) {
			(grouped[entry.day] ??= []).push(entry);
		}
		return grouped;
	});
</script>

<svelte:head>
	<title>{data.workation.name} · Tagesplan</title>
</svelte:head>

{#if data.isManager}
	<form class="card add" method="POST" action="?/add" use:enhance>
		<h2>Eintrag hinzufügen</h2>
		<div class="row">
			<label>
				Tag
				<select name="day">
					{#each days as day (day)}
						<option value={day}>{formatDate(day)}</option>
					{/each}
				</select>
			</label>
			<label>
				Von (optional)
				<input type="time" name="startTime" />
			</label>
			<label>
				Bis (optional)
				<input type="time" name="endTime" />
			</label>
		</div>
		<label>
			Titel
			<input name="title" placeholder="z. B. Frühstück, Coworking, Ausflug" />
		</label>
		<label>
			Beschreibung (optional)
			<textarea name="description" rows="2"></textarea>
		</label>
		{#if form?.message}
			<p class="error">{form.message}</p>
		{:else if form?.added}
			<p class="success">Eintrag hinzugefügt.</p>
		{/if}
		<div>
			<button>Hinzufügen</button>
		</div>
	</form>
{/if}

<div class="calendar">
	{#each days as day (day)}
		<section class="day card">
			<h3>{formatDayLong(day)}</h3>
			{#if (byDay[day] ?? []).length === 0}
				<p class="muted empty">Keine Einträge</p>
			{:else}
				<ul>
					{#each byDay[day] ?? [] as entry (entry.id)}
						<li>
							<div class="entry">
								{#if entry.startTime}
									<span class="time">
										{formatTime(entry.startTime)}{#if entry.endTime}–{formatTime(
												entry.endTime
											)}{/if}
									</span>
								{/if}
								<div class="body">
									<span class="title">{entry.title}</span>
									{#if entry.description}<p class="desc muted">{entry.description}</p>{/if}
								</div>
								{#if data.isManager}
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="entryId" value={entry.id} />
										<button class="link-danger" title="Löschen">×</button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>

<style>
	.add {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.add .row {
		display: flex;
		gap: 0.75rem;
	}
	.add .row label {
		flex: 1;
	}
	.calendar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.day h3 {
		margin: 0 0 0.6rem;
		font-size: 1rem;
	}
	.empty {
		margin: 0;
		font-size: 0.9rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.entry {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}
	.time {
		font-variant-numeric: tabular-nums;
		color: var(--primary);
		font-weight: 500;
		white-space: nowrap;
		min-width: 6.5rem;
	}
	.body {
		flex: 1;
	}
	.desc {
		margin: 0.15rem 0 0;
		font-size: 0.9rem;
	}
	.link-danger {
		background: none;
		border: none;
		color: var(--danger);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 0 0.3rem;
	}
</style>
