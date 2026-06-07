<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Startseite</title>
</svelte:head>

<h1>Hallo, {data.user.username}!</h1>
<p>Du bist angemeldet. Diese Seite ist nur für eingeloggte Nutzer sichtbar.</p>

<form method="POST" action="?/logout" use:enhance>
	<button>Abmelden</button>
</form>
