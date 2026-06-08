<script lang="ts">
	import { CalendarDays, Receipt, ArrowRight, Plane, Wallet, CalendarClock } from '@lucide/svelte';
	import { formatDateRange, formatTime } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function daysLeftLabel(n: number): string {
		if (n <= 0) return 'Letzter Tag';
		if (n === 1) return 'Noch 1 Tag';
		return `Noch ${n} Tage`;
	}
	function startsInLabel(n: number): string {
		if (n <= 0) return 'beginnt heute';
		if (n === 1) return 'beginnt morgen';
		return `in ${n} Tagen`;
	}
</script>

<svelte:head>
	<title>Start · Workation</title>
</svelte:head>

<section class="hero reveal">
	<p class="eyebrow">Dein Basislager</p>
	<h1>Hallo, {data.user.username}.</h1>
</section>

<!-- Laufende Workation(s) -->
{#each data.current as c, i (c.workation.id)}
	<section class="card now reveal-1" style:animation-delay="{0.06 + i * 0.07}s">
		<div class="now-head">
			<div>
				<p class="eyebrow live"><span class="ping" aria-hidden="true"></span> Läuft gerade</p>
				<h2>{c.workation.name}</h2>
				<p class="muted faint">{formatDateRange(c.workation.startDate, c.workation.endDate)}</p>
			</div>
			<div class="stats">
				<div class="stat">
					<span class="stat-num">{c.dayNumber}<span class="stat-sub">/{c.totalDays}</span></span>
					<span class="stat-lbl">Tag</span>
				</div>
				<span class="pill coral">{daysLeftLabel(c.daysLeft)}</span>
			</div>
		</div>

		<div class="today">
			<h3><CalendarDays size={16} /> Heute auf dem Plan</h3>
			{#if c.todayEntries.length === 0}
				<p class="muted faint nothing">Heute ist nichts geplant — genieß den freien Tag. 🌊</p>
			{:else}
				<ul class="agenda">
					{#each c.todayEntries as e (e.id)}
						<li>
							<span class="time">
								{#if e.startTime}{formatTime(e.startTime)}{:else}ganztägig{/if}
							</span>
							<span class="title">{e.title}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="now-links">
			<a href="/workations/{c.workation.id}/schedule"><CalendarDays size={15} /> Tagesplan</a>
			<a href="/workations/{c.workation.id}/expenses"><Receipt size={15} /> Ausgaben</a>
			<a class="open" href="/workations/{c.workation.id}">Öffnen <ArrowRight size={15} /></a>
		</div>
	</section>
{/each}

<!-- Kommende Workations -->
{#if data.upcoming.length > 0}
	<section class="block reveal-2">
		<h2 class="sec-title"><CalendarClock size={18} /> Kommende Workations</h2>
		<ul class="up-list">
			{#each data.upcoming as u (u.workation.id)}
				<li>
					<a class="card interactive up" href="/workations/{u.workation.id}">
						<div>
							<strong class="up-name">{u.workation.name}</strong>
							<div class="muted faint">
								{formatDateRange(u.workation.startDate, u.workation.endDate)}
							</div>
						</div>
						<span class="pill aqua">{startsInLabel(u.startsInDays)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<!-- Leerer Zustand -->
{#if !data.hasAny}
	<section class="card empty reveal-1">
		<p class="muted">Du bist noch in keiner Workation. Warte auf eine Einladung oder lege selbst eine an.</p>
	</section>
{/if}

<!-- Schnellzugriff -->
<section class="block reveal-3">
	<div class="quick">
		<a class="card interactive tile" href="/workations">
			<span class="ico coral"><Plane size={20} /></span>
			<span class="t-body"><strong>Alle Workations</strong><span class="muted faint">Übersicht & verwalten</span></span>
			<ArrowRight size={16} class="t-arrow" />
		</a>
		<a class="card interactive tile" href="/settings">
			<span class="ico aqua"><Wallet size={20} /></span>
			<span class="t-body"><strong>Einstellungen</strong><span class="muted faint">PayPal-Benutzername</span></span>
			<ArrowRight size={16} class="t-arrow" />
		</a>
	</div>
</section>

<style>
	.hero {
		margin-bottom: 1.6rem;
	}
	.block {
		margin-top: 1.8rem;
	}
	.sec-title {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.9rem;
	}

	/* Laufende Workation */
	.now {
		padding: 1.5rem;
		margin-bottom: 1rem;
		border-color: rgba(255, 138, 92, 0.3);
	}
	.now-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.now-head h2 {
		margin: 0.25rem 0;
		font-size: 1.5rem;
	}
	.eyebrow.live {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--coral);
	}
	.ping {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--coral);
		box-shadow: 0 0 0 0 rgba(255, 138, 92, 0.6);
		animation: ping 1.8s var(--ease) infinite;
	}
	@keyframes ping {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 138, 92, 0.55);
		}
		70% {
			box-shadow: 0 0 0 8px rgba(255, 138, 92, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(255, 138, 92, 0);
		}
	}
	.stats {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
	}
	.stat-num {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 600;
	}
	.stat-sub {
		font-size: 1rem;
		color: var(--ink-faint);
	}
	.stat-lbl {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-faint);
		margin-top: 0.2rem;
	}
	.today {
		margin: 1.2rem 0;
		padding: 1rem 0;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.today h3 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0 0.7rem;
		font-size: 0.95rem;
		color: var(--ink-soft);
	}
	.nothing {
		margin: 0;
	}
	.agenda {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.agenda li {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
	}
	.agenda .time {
		font-variant-numeric: tabular-nums;
		color: var(--aqua);
		font-weight: 600;
		font-size: 0.88rem;
		min-width: 5rem;
	}
	.agenda .title {
		font-weight: 600;
	}
	.now-links {
		display: flex;
		gap: 1.2rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.now-links a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.now-links a:hover {
		color: var(--ink);
	}
	.now-links .open {
		margin-left: auto;
		color: var(--coral);
	}

	/* Kommende */
	.up-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.up {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		padding: 1rem 1.2rem;
		flex-wrap: wrap;
	}
	.up-name {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 560;
	}

	/* Schnellzugriff */
	.quick {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}
	.tile {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		text-decoration: none;
		color: inherit;
		padding: 1rem 1.2rem;
	}
	.ico {
		display: inline-flex;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 13px;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--glass-brd);
		flex-shrink: 0;
	}
	.ico.coral {
		color: var(--coral);
		background: rgba(255, 138, 92, 0.12);
	}
	.ico.aqua {
		color: var(--aqua);
		background: rgba(79, 224, 196, 0.12);
	}
	.t-body {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.t-body .muted {
		font-size: 0.82rem;
	}
	.tile :global(.t-arrow) {
		color: var(--ink-faint);
		transition: transform 0.25s var(--ease);
	}
	.tile:hover :global(.t-arrow) {
		transform: translateX(4px);
		color: var(--coral);
	}
	.empty {
		padding: 1.6rem;
		text-align: center;
	}
</style>
