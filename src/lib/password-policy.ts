/**
 * Lösenordspolicy delad med ParkKey CoreOS.
 * Krav: minst 6 tecken, minst en bokstav och minst en siffra.
 * Ingen validering här ersätter identitetstjänstens kontroll — den är ett komplement.
 */
export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_RULE_TEXT = "Minst 6 tecken, minst en bokstav och minst en siffra.";

export interface PasswordCheck {
  longEnough: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
  valid: boolean;
}

export function checkPassword(value: string): PasswordCheck {
  const longEnough = value.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /\p{L}/u.test(value);
  const hasDigit = /\d/.test(value);
  return { longEnough, hasLetter, hasDigit, valid: longEnough && hasLetter && hasDigit };
}

export function passwordError(value: string): string | null {
  const c = checkPassword(value);
  if (c.valid) return null;
  if (!c.longEnough) return `Lösenordet måste vara minst ${PASSWORD_MIN_LENGTH} tecken.`;
  if (!c.hasLetter) return "Lösenordet måste innehålla minst en bokstav.";
  return "Lösenordet måste innehålla minst en siffra.";
}

/** Sant när användaren redan valt ett eget lösenord efter första inloggningen. */
export function hasPersonalPassword(metadata: Record<string, unknown> | undefined | null): boolean {
  return metadata?.["password_set"] === true;
}
