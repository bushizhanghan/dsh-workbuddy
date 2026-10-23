/**
 * Pure formatting and classification helpers shared by the host half and the
 * browser card. Nothing here imports Node built-ins, so both sides can use it.
 *
 * The card itself cannot be imported by a test (it pulls
 * `@deepseek-ai/dsh-client-ui-primitives`, which only resolves inside DSH), so
 * any branch worth asserting on lives here instead.
 *
 * @module dsh-workmate/display
 */

const MS_PER_SECOND = 1_000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

/**
 * The upstream service writes its package dates in Beijing wall clock and
 * `parseUpstreamExpiry` reads them back the same way. Formatting therefore
 * shifts the timestamp by this offset and prints the UTC fields.
 */
const BEIJING_UTC_OFFSET_MS = 8 * MS_PER_HOUR

/** Zero-pad a date or time component to two digits. */
function pad2(part: number): string {
  return String(part).padStart(2, '0')
}

/**
 * Separator between the parts of a model row's display suffix.
 *
 * A middle dot rather than a hyphen or colon: model names already contain
 * hyphens (`Deepseek-V4.1-Flash`), so a hyphen separator would be ambiguous
 * about where the name ends and the rate begins.
 */
export const DISPLAY_PART_SEPARATOR = ' · '

/**
 * Join the non-empty parts of a display suffix, or `undefined` when there is
 * nothing to show.
 *
 * Both the host adapter and the card compose the same suffix — the billing rate
 * followed by any promotional badges — so the empty-part handling lives here
 * once rather than in each caller.
 */
export function joinDisplayParts(parts: ReadonlyArray<string | undefined>): string | undefined {
  const kept = parts.filter((part): part is string => part !== undefined && part !== '')
  return kept.length === 0 ? undefined : kept.join(DISPLAY_PART_SEPARATOR)
}

/**
 * Format an epoch millisecond timestamp the way the WorkBuddy app writes
 * package dates: Beijing wall clock, `YYYY/MM/DD HH:mm:ss`, zero padded, no
 * locale, no AM/PM.
 */
export function formatExpiry(value: number | undefined): string {
  if (value === undefined) return ''
  const date = new Date(value + BEIJING_UTC_OFFSET_MS)
  if (Number.isNaN(date.getTime())) return String(value)
  const day = `${date.getUTCFullYear()}/${pad2(date.getUTCMonth() + 1)}/${pad2(date.getUTCDate())}`
  const time = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`
  return `${day} ${time}`
}

/**
 * Days left before a package expires, rounded up so anything still in the
 * future reads as at least one day.
 *
 * `Math.ceil`, not `round` or `floor`: a pack expiring in six hours is "1 day",
 * not "0 days" — rounding would print a package that is still usable as already
 * gone. Zero and below mean expired.
 */
export function daysUntilExpiry(expiresAt: number, now: number = Date.now()): number {
  // `Math.ceil` of a tiny negative is `-0`, which `Object.is` and strict
  // equality treat as different from `0`; normalize so the card's `days <= 0`
  // check never sees a value that prints as `-0`.
  const days = Math.ceil((expiresAt - now) / MS_PER_DAY)
  return days === 0 ? 0 : days
}

/** Whole days at or below which an expiring package is worth flagging. */
export const EXPIRY_SOON_DAYS = 7

/**
 * `HH:MM:SS` left on a trip, clamped at zero.
 *
 * `Math.floor`, not `ceil`: a countdown that reads `00:00:01` while the buddy is
 * already home would be a lie in the other direction. Hours are not wrapped at
 * 24 — a trip longer than a day should read `26:00:00`, not `02:00:00`.
 */
export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / MS_PER_SECOND))
  const hours = Math.floor(total / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(total % 60)}`
}

/**
 * Whether the manual check-in button should be dimmed for today.
 *
 * Today's check-in being done is *not* enough on its own: this one click also
 * sends the buddy on its trip and sweeps the growth-center tasks, so a finished
 * check-in alongside anything still claimable must keep the button live. Only
 * when all three are spent is there nothing left to press it for.
 *
 * `tasks` is optional so the two-argument callers (and the older tests) keep
 * their meaning: with no sweep recorded, the task half cannot gate the button.
 */
export function checkinExhausted(
  checkin: { todayCheckedIn?: boolean } | undefined,
  growth: { state?: string; dailyLimitReached?: boolean } | undefined,
  tasks?: { outstanding?: number } | undefined,
): boolean {
  if (checkin?.todayCheckedIn !== true) return false
  if (tasks?.outstanding !== undefined && tasks.outstanding > 0) return false
  if (growth === undefined) return true
  if (growth.state === 'arrived') return false
  return !(growth.state === 'idle' && growth.dailyLimitReached !== true)
}

/**
 * What a manual check-in round trip should tell the user.
 *
 * Two independent things can go wrong and they need different wording: the
 * request itself can fail (`ok: false`), or the request can succeed while the
 * *action* failed — the host answers `200 { state: 'ok', checkin: { state:
 * 'error', reason } }` so the reason survives the envelope. Both are
 * `kind: 'failed'`; `reason` is the host's own text and must not be swallowed.
 *
 * This lives here because the card cannot be imported by a test, and it is the
 * exact branch that made a successful check-in look like nothing happened.
 */
export type CheckinOutcomeKind = 'done' | 'already' | 'failed'

export interface CheckinOutcome {
  kind: CheckinOutcomeKind
  /** Host-supplied failure text; only present when `kind` is `'failed'`. */
  reason?: string
  /**
   * Credits the growth trip just paid out, when it claimed something. A manual
   * check-in also runs the trip, and "已签到" alone hides the reward that landed.
   */
  claimed?: number
}

export function classifyCheckin(result: {
  ok: boolean
  error?: string
  checkin?: { state?: string; reason?: string; claimed?: number }
}): CheckinOutcome {
  if (!result.ok) {
    return result.error === undefined ? { kind: 'failed' } : { kind: 'failed', reason: result.error }
  }
  const state = result.checkin?.state
  if (state === 'error') {
    return result.checkin?.reason === undefined ? { kind: 'failed' } : { kind: 'failed', reason: result.checkin.reason }
  }
  const claimed = result.checkin?.claimed
  return {
    kind: state === 'already-checked-in' ? 'already' : 'done',
    ...claimed === undefined ? {} : { claimed },
  }
}