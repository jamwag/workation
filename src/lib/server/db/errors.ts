/** True, wenn der Fehler eine Postgres unique_violation (SQLSTATE 23505) ist. */
export function isUniqueViolation(error: unknown): boolean {
	const cause = (error as { cause?: { code?: string } })?.cause;
	return cause?.code === '23505';
}
