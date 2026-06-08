<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, scale } from 'svelte/transition';
	import { ChevronLeft, ChevronRight, Trash2, X } from '@lucide/svelte';
	import { formatDate, formatDateRange, formatTime } from '$lib/format';
	import {
		addDaysISO,
		dayOfMonth,
		minutesToTime,
		timeToMinutes,
		weekdayShort,
		weekStartsInRange
	} from '$lib/calendar';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const DAY_START = 7; // erste sichtbare Stunde
	const DAY_END = 23; // letzte sichtbare Stunde
	const HOUR_PX = 48;
	const RANGE_MIN = DAY_START * 60;
	const RANGE_MAX = DAY_END * 60;

	const slots = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
	const hourLabels = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);

	const start = $derived(data.workation.startDate);
	const end = $derived(data.workation.endDate);

	let byDay = $derived.by(() => {
		const grouped: Record<string, typeof data.entries> = {};
		for (const entry of data.entries) {
			(grouped[entry.day] ??= []).push(entry);
		}
		return grouped;
	});

	let weeks = $derived(weekStartsInRange(start, end));
	let weekIdx = $state(0);
	let weekStart = $derived(weeks[weekIdx] ?? weeks[0]);
	let days = $derived(Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)));

	// Modal-Zustand fürs Hinzufügen (Slot-Klick)
	let modal = $state<{ day: string; startTime: string; endTime: string } | null>(null);

	function inRange(iso: string): boolean {
		return iso >= start && iso <= end;
	}

	function openSlot(day: string, hour: number) {
		if (!data.isManager || !inRange(day)) return;
		modal = {
			day,
			startTime: minutesToTime(hour * 60),
			endTime: minutesToTime((hour + 1) * 60)
		};
	}

	/** Zeitgebundene Einträge eines Tages mit Überlappungs-Spalten (Cluster-basiert). */
	function layoutDay(day: string) {
		const items = (byDay[day] ?? [])
			.filter((e) => e.startTime)
			.map((e) => ({
				entry: e,
				startMin: timeToMinutes(e.startTime as string),
				endMin: e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.startTime as string) + 60
			}))
			.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

		const out: { entry: (typeof items)[number]['entry']; startMin: number; endMin: number; col: number; cols: number }[] = [];
		let cluster: typeof items = [];
		let clusterEnd = -1;

		const flush = () => {
			if (cluster.length === 0) return;
			const colEnds: number[] = [];
			const placed = cluster.map((it) => {
				let col = colEnds.findIndex((e) => e <= it.startMin);
				if (col === -1) {
					col = colEnds.length;
					colEnds.push(it.endMin);
				} else {
					colEnds[col] = it.endMin;
				}
				return { it, col };
			});
			const cols = colEnds.length;
			for (const { it, col } of placed) out.push({ ...it, col, cols });
			cluster = [];
			clusterEnd = -1;
		};

		for (const it of items) {
			if (cluster.length && it.startMin >= clusterEnd) flush();
			cluster.push(it);
			clusterEnd = Math.max(clusterEnd, it.endMin);
		}
		flush();
		return out;
	}

	function allDay(day: string) {
		return (byDay[day] ?? []).filter((e) => !e.startTime);
	}

	function blockStyle(startMin: number, endMin: number, col: number, cols: number): string {
		const top = ((Math.max(startMin, RANGE_MIN) - RANGE_MIN) / 60) * HOUR_PX;
		const bottom = ((Math.min(endMin, RANGE_MAX) - RANGE_MIN) / 60) * HOUR_PX;
		const height = Math.max(22, bottom - top);
		const width = 100 / cols;
		return `top:${top}px;height:${height}px;left:${col * width}%;width:${width}%;`;
	}
</script>

<svelte:head>
	<title>{data.workation.name} · Tagesplan</title>
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (modal = null)} />

<section class="card cal">
	<header class="wk-head">
		<button class="ghost nav" onclick={() => (weekIdx -= 1)} disabled={weekIdx === 0} aria-label="Vorherige Woche">
			<ChevronLeft size={18} />
		</button>
		<span class="wk-label">{formatDateRange(weekStart, addDaysISO(weekStart, 6))}</span>
		<button class="ghost nav" onclick={() => (weekIdx += 1)} disabled={weekIdx === weeks.length - 1} aria-label="Nächste Woche">
			<ChevronRight size={18} />
		</button>
	</header>

	<!-- Tag-Köpfe -->
	<div class="cols head-row">
		<div class="gutter"></div>
		{#each days as day (day)}
			<div class="day-head" class:out={!inRange(day)}>
				<span class="wd">{weekdayShort(day)}</span>
				<span class="dn">{dayOfMonth(day)}</span>
			</div>
		{/each}
	</div>

	<!-- Ganztägig -->
	{#if days.some((d) => allDay(d).length > 0)}
		<div class="cols allday">
			<div class="gutter"><span>ganztägig</span></div>
			{#each days as day (day)}
				<div class="allday-cell" class:out={!inRange(day)}>
					{#each allDay(day) as e (e.id)}
						<span class="chip-ev">{e.title}</span>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Zeitraster -->
	<div class="grid-scroll">
		<div class="cols grid" style:height="{slots.length * HOUR_PX}px">
			<div class="gutter time-axis">
				{#each hourLabels as h (h)}
					<span class="hl" style:top="{(h - DAY_START) * HOUR_PX}px">{h}:00</span>
				{/each}
			</div>

			{#each days as day, di (day)}
				<div class="day-col" class:out={!inRange(day)}>
					{#each slots as h (h)}
						<button
							class="slot"
							style:top="{(h - DAY_START) * HOUR_PX}px"
							style:height="{HOUR_PX}px"
							disabled={!data.isManager || !inRange(day)}
							aria-label="{formatDate(day)}, {h}:00 – Eintrag hinzufügen"
							onclick={() => openSlot(day, h)}
						></button>
					{/each}

					{#each layoutDay(day) as p (p.entry.id)}
						<div class="event" style={blockStyle(p.startMin, p.endMin, p.col, p.cols)}>
							<span class="ev-time">{formatTime(p.entry.startTime)}</span>
							<span class="ev-title">{p.entry.title}</span>
							{#if data.isManager}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="entryId" value={p.entry.id} />
									<button class="ev-del" title="Löschen"><Trash2 size={13} /></button>
								</form>
							{/if}
						</div>
					{/each}

					{#if di === 0}
						<!-- dezente Stundenlinien als Hintergrund nur einmal nötig pro Spalte; via slot-border -->
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if data.isManager}
		<p class="hint faint">Tipp: In einen freien Zeit-Slot klicken, um einen Eintrag hinzuzufügen.</p>
	{/if}
</section>

<!-- Hinzufügen-Modal -->
{#if modal}
	<div
		class="overlay"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) modal = null;
		}}
		transition:fade={{ duration: 150 }}
	>
		<div
			class="modal card"
			role="dialog"
			aria-modal="true"
			aria-label="Eintrag hinzufügen"
			tabindex="-1"
			transition:scale={{ duration: 200, start: 0.96 }}
		>
			<div class="modal-head">
				<h3>Neuer Eintrag · {formatDate(modal.day)}</h3>
				<button class="ghost" onclick={() => (modal = null)} aria-label="Schließen"><X size={18} /></button>
			</div>
			<form
				method="POST"
				action="?/add"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') modal = null;
					};
				}}
			>
				<input type="hidden" name="day" value={modal.day} />
				<div class="times">
					<label>Von<input type="time" name="startTime" value={modal.startTime} /></label>
					<label>Bis<input type="time" name="endTime" value={modal.endTime} /></label>
				</div>
				<label>Titel<input name="title" placeholder="z. B. Coworking, Ausflug" /></label>
				<label>Beschreibung (optional)<textarea name="description" rows="2"></textarea></label>
				{#if form?.message}<p class="error">{form.message}</p>{/if}
				<div class="modal-actions">
					<button>Speichern</button>
					<button type="button" class="secondary" onclick={() => (modal = null)}>Abbrechen</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.cal {
		padding: 1.1rem;
	}
	.wk-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.9rem;
	}
	.wk-label {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 560;
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

	/* Spalten-Raster: Gutter + 7 Tage */
	.cols {
		display: grid;
		grid-template-columns: 3.2rem repeat(7, minmax(5.5rem, 1fr));
	}
	.gutter {
		font-size: 0.7rem;
		color: var(--ink-faint);
	}

	.head-row .day-head {
		text-align: center;
		padding: 0.3rem 0;
		display: flex;
		flex-direction: column;
		border-left: 1px solid var(--line);
	}
	.day-head .wd {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink-faint);
	}
	.day-head .dn {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 560;
	}
	.day-head.out {
		opacity: 0.4;
	}

	.allday {
		border-top: 1px solid var(--line);
		min-height: 2rem;
	}
	.allday .gutter {
		display: flex;
		align-items: center;
	}
	.allday-cell {
		border-left: 1px solid var(--line);
		padding: 0.2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
	}
	.allday-cell.out {
		background: rgba(0, 0, 0, 0.12);
	}
	.chip-ev {
		font-size: 0.72rem;
		padding: 0.1rem 0.4rem;
		border-radius: 6px;
		background: rgba(79, 224, 196, 0.18);
		color: var(--aqua);
		white-space: nowrap;
	}

	.grid-scroll {
		max-height: 62vh;
		overflow: auto;
		border-top: 1px solid var(--line);
		margin-top: 0;
	}
	.grid {
		position: relative;
	}
	.time-axis {
		position: relative;
	}
	.hl {
		position: absolute;
		right: 0.4rem;
		transform: translateY(-50%);
		font-variant-numeric: tabular-nums;
	}

	.day-col {
		position: relative;
		border-left: 1px solid var(--line);
	}
	.day-col.out {
		background: rgba(0, 0, 0, 0.12);
	}

	.slot {
		position: absolute;
		left: 0;
		right: 0;
		background: none;
		border: none;
		border-top: 1px solid var(--line);
		border-radius: 0;
		box-shadow: none;
		padding: 0;
		cursor: pointer;
		transition: background 0.15s var(--ease);
	}
	.slot::after {
		display: none;
	}
	.slot:hover:not(:disabled) {
		background: rgba(255, 138, 92, 0.1);
	}
	.slot:disabled {
		cursor: default;
	}

	.event {
		position: absolute;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 3px 6px;
		border-radius: 7px;
		background: linear-gradient(135deg, rgba(255, 138, 92, 0.92), rgba(255, 99, 71, 0.92));
		color: #1a0e08;
		box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.25);
		z-index: 2;
		font-size: 0.74rem;
		line-height: 1.15;
	}
	.ev-time {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}
	.ev-title {
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ev-del {
		position: absolute;
		top: 2px;
		right: 2px;
		padding: 1px;
		background: rgba(0, 0, 0, 0.18);
		border: none;
		border-radius: 5px;
		color: #1a0e08;
		opacity: 0;
		box-shadow: none;
		transition: opacity 0.15s;
	}
	.ev-del::after {
		display: none;
	}
	.event:hover .ev-del {
		opacity: 1;
	}

	.hint {
		font-size: 0.78rem;
		margin: 0.8rem 0 0;
	}

	/* Modal */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(6, 12, 18, 0.55);
		backdrop-filter: blur(4px);
		display: grid;
		place-items: center;
		padding: 1rem;
	}
	.modal {
		width: 100%;
		max-width: 24rem;
		padding: 1.4rem;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.modal-head h3 {
		margin: 0;
	}
	.modal form {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.times {
		display: flex;
		gap: 0.7rem;
	}
	.times label {
		flex: 1;
	}
	.modal-actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.3rem;
	}

	@media (max-width: 640px) {
		.grid-scroll {
			overflow-x: auto;
		}
		.cols {
			min-width: 42rem;
		}
	}
</style>
