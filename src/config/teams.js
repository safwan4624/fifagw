// ─── FIFA World Cup 2026 Team Data ───────────────────────────────────────────
// All 48 teams with FIFA codes and emoji flags.

const TEAMS = {
  // ── AFC (9) ───────────────────────────────────────────────────────────────
  'Australia': { code: 'AUS', flag: '🇦🇺' },
  'Iran': { code: 'IRN', flag: '🇮🇷' },
  'Iraq': { code: 'IRQ', flag: '🇮🇶' },
  'Japan': { code: 'JPN', flag: '🇯🇵' },
  'Jordan': { code: 'JOR', flag: '🇯🇴' },
  'Qatar': { code: 'QAT', flag: '🇶🇦' },
  'Saudi Arabia': { code: 'KSA', flag: '🇸🇦' },
  'South Korea': { code: 'KOR', flag: '🇰🇷' },
  'Uzbekistan': { code: 'UZB', flag: '🇺🇿' },

  // ── CAF (10) ──────────────────────────────────────────────────────────────
  'Algeria': { code: 'ALG', flag: '🇩🇿' },
  'Cape Verde': { code: 'CPV', flag: '🇨🇻' },
  'DR Congo': { code: 'COD', flag: '🇨🇩' },
  'Egypt': { code: 'EGY', flag: '🇪🇬' },
  'Ghana': { code: 'GHA', flag: '🇬🇭' },
  'Ivory Coast': { code: 'CIV', flag: '🇨🇮' },
  'Morocco': { code: 'MAR', flag: '🇲🇦' },
  'Senegal': { code: 'SEN', flag: '🇸🇳' },
  'South Africa': { code: 'RSA', flag: '🇿🇦' },
  'Tunisia': { code: 'TUN', flag: '🇹🇳' },

  // ── CONCACAF (6) ──────────────────────────────────────────────────────────
  'Canada': { code: 'CAN', flag: '🇨🇦' },
  'Curaçao': { code: 'CUW', flag: '🇨🇼' },
  'Haiti': { code: 'HAI', flag: '🇭🇹' },
  'Mexico': { code: 'MEX', flag: '🇲🇽' },
  'Panama': { code: 'PAN', flag: '🇵🇦' },
  'USA': { code: 'USA', flag: '🇺🇸' },

  // ── CONMEBOL (6) ──────────────────────────────────────────────────────────
  'Argentina': { code: 'ARG', flag: '🇦🇷' },
  'Brazil': { code: 'BRA', flag: '🇧🇷' },
  'Colombia': { code: 'COL', flag: '🇨🇴' },
  'Ecuador': { code: 'ECU', flag: '🇪🇨' },
  'Paraguay': { code: 'PAR', flag: '🇵🇾' },
  'Uruguay': { code: 'URU', flag: '🇺🇾' },

  // ── OFC (1) ───────────────────────────────────────────────────────────────
  'New Zealand': { code: 'NZL', flag: '🇳🇿' },

  // ── UEFA (16) ─────────────────────────────────────────────────────────────
  'Austria': { code: 'AUT', flag: '🇦🇹' },
  'Belgium': { code: 'BEL', flag: '🇧🇪' },
  'Bosnia and Herzegovina': { code: 'BIH', flag: '🇧🇦' },
  'Croatia': { code: 'CRO', flag: '🇭🇷' },
  'Czech Republic': { code: 'CZE', flag: '🇨🇿' },
  'England': { code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'France': { code: 'FRA', flag: '🇫🇷' },
  'Germany': { code: 'GER', flag: '🇩🇪' },
  'Netherlands': { code: 'NED', flag: '🇳🇱' },
  'Norway': { code: 'NOR', flag: '🇳🇴' },
  'Portugal': { code: 'POR', flag: '🇵🇹' },
  'Scotland': { code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Spain': { code: 'ESP', flag: '🇪🇸' },
  'Sweden': { code: 'SWE', flag: '🇸🇪' },
  'Switzerland': { code: 'SUI', flag: '🇨🇭' },
  'Turkey': { code: 'TUR', flag: '🇹🇷' },
};

/**
 * Get the emoji flag for a team.
 * @param {string} teamName — e.g. "Argentina"
 * @returns {string} emoji flag or a generic flag if not found
 */
export function getFlag(teamName) {
  return TEAMS[teamName]?.flag ?? '🏳️';
}

/**
 * Get the FIFA code for a team.
 * @param {string} teamName — e.g. "Argentina"
 * @returns {string} FIFA code or 'UNK' if not found
 */
export function getTeamCode(teamName) {
  return TEAMS[teamName]?.code ?? 'UNK';
}

/**
 * Get all team names as a sorted array.
 * @returns {string[]}
 */
export function getAllTeamNames() {
  return Object.keys(TEAMS).filter((t) => t !== 'TBD').sort();
}

/**
 * Get full team data { code, flag } by name.
 * @param {string} teamName
 * @returns {{ code: string, flag: string } | undefined}
 */
export function getTeamData(teamName) {
  return TEAMS[teamName];
}

export default TEAMS;
