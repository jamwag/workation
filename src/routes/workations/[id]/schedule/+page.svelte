<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { ChevronLeft, ChevronRight, Plus, Trash2 } from '@lucide/svelte';
	import { formatDayLong, formatTime } from '$lib/format';
	import { dayOfMonth, monthLabel, monthMatrix, monthsInRange } from '$lib/calendar';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	const start = $derived(data.workation.startDate);
	const end = $derived(data.workation.endDate);

	// Einträge nach Tag gruppieren.
	let byDay = $derived.by(() => {
		const grouped: Record<string, typeof data.entries> = {};
		for (const entry of data.entries) {
			(grouped[entry.day] ??= []).push(entry);
		}
		return grouped;
	});

	let months = $derived(monthsInRange(start, end));
	let monthIdx = $state(0);
	// Initialwert aus den Props; danach frei wählbar. untrack vermeidet die Reaktivitäts-Warnung.
	let selectedDay = $state(untrack(() => data.workation.startDate));

	let view = $derived(months[monthIdx] ?? months[0]);
	let weeks = $derived(monthMatrix(view.year, view.month));
	let selectedEntries = $derived(byDay[selectedDay] ?? []);

	function inRange(iso: string): boolean {
		return iso >= start && iso <= end;
	}
	function selectDay(iso: string) {
		if (inRange(iso)) selectedDay = iso;
	}
</script>

<svelte:head>
	<title>{data.workation.name} · Tagesplan</title>
</svelte:head>

<div class="layout">
	<!-- Kalender -->
	<section class="card cal">
		<header class="cal-head">
			<button
				class="ghost nav"
				onclick={() => (monthIdx -= 1)}
				disabled={monthIdx === 0}
				aria-label="Vorheriger Monat"
			>
				<ChevronLeft size={18} />
			</button>
			<span class="month">{monthLabel(view.year, view.month)}</span>
			<button
				class="ghost nav"
				onclick={() => (monthIdx += 1)}
				disabled={monthIdx === months.length - 1}
				aria-label="Nächster Monat"
			>
				<ChevronRight size={18} />
			</button>
		</header>

		<div class="weekdays">
			{#each WEEKDAYS as wd (wd)}<span>{wd}</span>{/each}
		</div>

		<div class="grid">
			{#each weeks as week, wi (wi)}
				{#each week as iso, di (di)}
					{#if iso === null}
						<span class="cell empty"></span>
					{:else}
						<button
							type="button"
							class="cell"
							class:inrange={inRange(iso)}
							class:selected={iso === selectedDay}
							disabled={!inRange(iso)}
							onclick={() => selectDay(iso)}
						>
							<span class="num">{dayOfMonth(iso)}</span>
							{#if (byDay[iso] ?? []).length > 0}
								<span class="marker" aria-hidden="true"></span>
							{/if}
						</button>
					{/if}
				{/each}
			{/each}
		</div>
	</section>

	<!-- Tagesdetail -->
	<section class="detail">
		{#key selectedDay}
			<div in:fade={{ duration: 200 }}>
				<h2>{formatDayLong(selectedDay)}</h2>

				{#if selectedEntries.length === 0}
					<p class="muted empty-day">Keine Einträge an diesem Tag.</p>
				{:else}
					<ul class="timeline">
						{#each selectedEntries as entry (entry.id)}
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
										<button class="ghost del" title="Löschen"><Trash2 size={15} /></button>
									</form>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/key}

		{#if data.isManager}
			<form class="card add" method="POST" action="?/add" use:enhance>
				<h3><Plus size={16} /> Eintrag hinzufügen</h3>
				<input type="hidden" name="day" value={selectedDay} />
				<div class="times">
					<label>Von<input type="time" name="startTime" /></label>
					<label>Bis<input type="time" name="endTime" /></label>
				</div>
				<label>
					Titel
					<input name="title" placeholder="z. B. Coworking, Ausflug" />
				</label>
				<label>
					Beschreibung (optional)
					<textarea name="description" rows="2"></textarea>
				</label>
				{#if form?.message}
					<p class="error">{form.message}</p>
				{:else if form?.added}
					<p class="success">Hinzugefügt ✓</p>
				{/if}
				<div>
					<button>Hinzufügen</button>
				</div>
			</form>
		{/if}
	</section>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(17rem, 22rem) 1fr;
		gap: 1.2rem;
		align-items: start;
	}
	@media (max-width: 720px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}

	/* Kalender */
	.cal {
		padding: 1.1rem;
	}
	.cal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.8rem;
	}
	.month {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 560;
		text-transform: capitalize;
	}
	.nav {
		color: var(--ink-soft);
		padding: 0.3rem;
		border-radius: 8px;
	}
	.nav:hover:not(:disabled) {
		color: var(--ink);
		background: var(--glass);
	}
	.nav:disabled {
		opacity: 0.3;
	}
	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.2rem;
		margin-bottom: 0.4rem;
	}
	.weekdays span {
		text-align: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.2rem;
	}
	.cell {
		aspect-ratio: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 10px;
		box-shadow: none;
		color: var(--ink-faint);
		font-weight: 500;
		font-size: 0.9rem;
		cursor: default;
		padding: 0;
	}
	.cell::after {
		display: none;
	}
	.cell.empty {
		visibility: hidden;
	}
	.cell.inrange {
		color: var(--ink);
		background: var(--glass);
		cursor: pointer;
	}
	.cell.inrange:hover {
		background: var(--glass-2);
		transform: none;
		filter: none;
	}
	.cell.selected {
		color: #18120d;
		background: linear-gradient(135deg, var(--coral), var(--coral-deep));
		box-shadow: 0 6px 16px -7px rgba(255, 99, 71, 0.8);
	}
	.cell:disabled {
		opacity: 0.45;
	}
	.marker {
		position: absolute;
		bottom: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--aqua);
	}
	.cell.selected .marker {
		background: #18120d;
	}

	/* Detail */
	.detail h2 {
		text-transform: capitalize;
		margin-bottom: 1rem;
	}
	.empty-day {
		padding: 1rem 0;
	}
	.timeline {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
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
		min-width: 6rem;
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
	}
	.del:hover {
		color: var(--danger);
	}

	/* Add-Form */
	.add {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.add h3 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		color: var(--ink-soft);
	}
	.times {
		display: flex;
		gap: 0.7rem;
	}
	.times label {
		flex: 1;
	}
</style>
