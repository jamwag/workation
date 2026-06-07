<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { eachDayISO, formatDate, formatDayLong, formatTime } from '$lib/format';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let days = $derived(eachDayISO(data.workation.startDate, data.workation.endDate));

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
				Von
				<input type="time" name="startTime" />
			</label>
			<label>
				Bis
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
			<p class="success">Eintrag hinzugefügt ✓</p>
		{/if}
		<div>
			<button>Hinzufügen</button>
		</div>
	</form>
{/if}

<div class="calendar">
	{#each days as day, i (day)}
		<section class="card day" in:fly={{ y: 14, duration: 400, delay: 40 * i, easing: cubicOut }}>
			<h3>
				<span class="weekday">{formatDayLong(day).split(',')[0]}</span>
				<span class="date">{formatDate(day)}</span>
			</h3>
			{#if (byDay[day] ?? []).length === 0}
				<p class="muted faint empty">Keine Einträge</p>
			{:else}
				<ul class="timeline">
					{#each byDay[day] ?? [] as entry (entry.id)}
						<li>
							<span class="bullet" aria-hidden="true"></span>
							{#if entry.startTime}
								<span class="time">
									{formatTime(entry.startTime)}{#if entry.endTime}–{formatTime(entry.endTime)}{/if}
								</span>
							{:else}
								<span class="time faint">ganztägig</span>
							{/if}
							<div class="body">
								<span class="title">{entry.title}</span>
								{#if entry.description}<p class="desc muted">{entry.description}</p>{/if}
							</div>
							{#if data.isManager}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="entryId" value={entry.id} />
									<button class="ghost del" title="Löschen">×</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>

<style>
	.add {
		margin-bottom: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.add .row {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.add .row label {
		flex: 1;
		min-width: 7rem;
	}
	.calendar {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.day h3 {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin: 0 0 0.8rem;
	}
	.weekday {
		font-family: var(--font-display);
		font-size: 1.1rem;
	}
	.date {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--ink-faint);
	}
	.empty {
		margin: 0;
		font-size: 0.9rem;
	}
	.timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.timeline li {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		position: relative;
		padding-left: 1rem;
	}
	.bullet {
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--coral);
		box-shadow: 0 0 10px 1px rgba(255, 138, 92, 0.6);
	}
	.time {
		font-variant-numeric: tabular-nums;
		color: var(--aqua);
		font-weight: 600;
		font-size: 0.88rem;
		white-space: nowrap;
		min-width: 6.5rem;
	}
	.body {
		flex: 1;
	}
	.title {
		font-weight: 600;
	}
	.desc {
		margin: 0.15rem 0 0;
		font-size: 0.9rem;
	}
	.del {
		color: var(--ink-faint);
		font-size: 1.2rem;
		line-height: 1;
	}
	.del:hover {
		color: var(--danger);
	}
</style>
