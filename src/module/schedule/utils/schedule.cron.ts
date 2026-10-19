import { CronExpressionParser } from 'cron-parser';

/**
 * Client-side reading of a crontab, mirroring model.ResolveCronSpec in the engine: 5-field cron (minute first, no
 * seconds) or an @descriptor, with an optional inline TZ=/CRON_TZ= prefix that wins over the timezone field. The
 * engine stays authoritative; this only drives the description and the next-run preview, since the API returns
 * neither.
 */

export type CronAnalysis =
	| {
			ok: true;
			/** The zone ticks are evaluated in: the inline prefix when present, else the timezone field. */
			zone: string;
			inlineZone: boolean;
			description: string | null;
			/** Upcoming tick times after `from` (default now). */
			next: (count: number, from?: Date) => Date[];
	  }
	| { ok: false; error: string };

const INLINE_ZONE = /^(?:CRON_TZ|TZ)=(\S*)\s*(.*)$/;

// robfig/cron's descriptors; cron-parser's extras (@weekdays, @minutely, …) are not accepted by the engine.
const DESCRIPTORS: Record<string, string> = {
	'@yearly': '0 0 1 1 *',
	'@annually': '0 0 1 1 *',
	'@monthly': '0 0 1 * *',
	'@weekly': '0 0 * * 0',
	'@daily': '0 0 * * *',
	'@midnight': '0 0 * * *',
	'@hourly': '0 * * * *',
};

const DURATION_UNITS_MS: Record<string, number> = {
	ns: 1e-6,
	us: 1e-3,
	µs: 1e-3,
	μs: 1e-3,
	ms: 1,
	s: 1000,
	m: 60_000,
	h: 3_600_000,
};

const DURATION_PART = /(\d+(?:\.\d+)?|\.\d+)(ns|us|µs|μs|ms|s|m|h)/g;

/** Parses a Go `time.Duration` string (e.g. `1h30m`, `90s`) to milliseconds; null when it is not one. */
export const parseGoDuration = (value: string): number | null => {
	const text = value.trim();
	if (!text || text.replace(DURATION_PART, '') !== '') return null;
	let total = 0;
	for (const [, amount, unit] of text.matchAll(DURATION_PART)) total += Number(amount) * DURATION_UNITS_MS[unit];
	return total;
};

export const isValidTimeZone = (zone: string) => {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: zone });
		return true;
	} catch {
		return false;
	}
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const isNumber = (field: string) => /^\d+$/.test(field);

const pad = (value: string) => value.padStart(2, '0');

const describeDays = (field: string): string | null => {
	if (field === '1-5') return 'weekday';
	if (field === '0,6' || field === '6,0') return 'weekend day';
	const days = field.split(',');
	if (!days.every(isNumber)) return null;
	return days.map((day) => DAY_NAMES[Number(day) % 7]).join(', ');
};

/** Plain-language text for the common shapes; null for anything more involved. */
export const describeCron = (expression: string): string | null => {
	const fields = expression.trim().split(/\s+/);
	if (fields.length !== 5) return null;
	const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
	const everyDay = dayOfMonth === '*' && month === '*' && dayOfWeek === '*';

	if (fields.every((field) => field === '*')) return 'Every minute';
	if (/^\*\/\d+$/.test(minute) && hour === '*' && everyDay) return `Every ${minute.slice(2)} minutes`;
	if (isNumber(minute) && hour === '*' && everyDay) return `Every hour at minute ${Number(minute)}`;
	if (isNumber(minute) && /^\*\/\d+$/.test(hour) && everyDay)
		return `Every ${hour.slice(2)} hours at minute ${Number(minute)}`;
	if (!isNumber(minute) || !isNumber(hour) || month !== '*') return null;

	const time = `${pad(hour)}:${pad(minute)}`;
	if (everyDay) return `Every day at ${time}`;
	if (dayOfMonth === '*') {
		const days = describeDays(dayOfWeek);
		return days && `Every ${days} at ${time}`;
	}
	if (dayOfWeek === '*' && isNumber(dayOfMonth)) return `Day ${Number(dayOfMonth)} of every month at ${time}`;
	return null;
};

const formatDuration = (ms: number) => {
	const parts: string[] = [];
	let rest = Math.round(ms / 1000);
	for (const [unit, size] of [
		['h', 3600],
		['m', 60],
		['s', 1],
	] as const) {
		const amount = Math.floor(rest / size);
		if (amount > 0) parts.push(`${amount}${unit}`);
		rest -= amount * size;
	}
	return parts.join(' ') || '1s';
};

export const analyzeCrontab = (crontab: string, timezone: string): CronAnalysis => {
	let spec = crontab.trim();
	if (!spec) return { ok: false, error: 'Enter a crontab' };

	let zone = timezone.trim() || 'UTC';
	const inline = INLINE_ZONE.exec(spec);
	if (inline) {
		const [, inlineZone, rest] = inline;
		if (!inlineZone || !rest.trim()) return { ok: false, error: 'A TZ= prefix needs a zone and a schedule' };
		zone = inlineZone;
		spec = rest.trim();
	}
	if (!isValidTimeZone(zone)) return { ok: false, error: `Unknown timezone ${zone}` };

	const base = { ok: true as const, zone, inlineZone: !!inline };

	if (spec.startsWith('@every')) {
		const ms = parseGoDuration(spec.slice('@every'.length));
		if (ms === null) return { ok: false, error: 'Use a duration like @every 5m or @every 1h30m' };
		// robfig/cron runs at least once per second and counts from when the engine registers the schedule.
		const delay = Math.max(1000, Math.floor(ms / 1000) * 1000);
		return {
			...base,
			description: `Every ${formatDuration(delay)}`,
			next: (count, from = new Date()) =>
				Array.from({ length: count }, (_, index) => new Date(from.getTime() + delay * (index + 1))),
		};
	}

	let expression = spec;
	if (spec.startsWith('@')) {
		const mapped = DESCRIPTORS[spec];
		if (!mapped) return { ok: false, error: `Unknown descriptor ${spec}` };
		expression = mapped;
	} else if (spec.split(/\s+/).length !== 5) {
		return { ok: false, error: 'Use 5 fields: minute hour day-of-month month day-of-week (no seconds)' };
	}

	try {
		CronExpressionParser.parse(expression, { tz: zone });
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : 'Invalid crontab' };
	}

	return {
		...base,
		description: describeCron(expression),
		next: (count, from = new Date()) => {
			const parsed = CronExpressionParser.parse(expression, { tz: zone, currentDate: from });
			return Array.from({ length: count }, () => parsed.next().toDate());
		},
	};
};

/** A tick time as the wall clock in the schedule's zone reads it. */
export const formatInZone = (date: Date, zone: string) =>
	new Intl.DateTimeFormat('en-GB', {
		timeZone: zone,
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).format(date);
