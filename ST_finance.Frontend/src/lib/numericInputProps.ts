/**
 * numericInputProps
 *
 * A reusable spread-object for amount/numeric <input> elements.
 * - Uses type="text" (avoids browser spinner arrows & inconsistent number handling)
 * - inputMode="decimal" → opens decimal numpad on iOS/Android
 * - pattern restricts to valid decimal numbers
 * - onKeyDown blocks non-numeric characters on desktop keyboards
 */

const ALLOWED_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  ".",
]);

function blockNonNumericKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  // Allow Ctrl/Cmd combos (copy, paste, select-all, etc.)
  if (e.ctrlKey || e.metaKey) return;
  // Allow digits 0-9
  if (e.key >= "0" && e.key <= "9") return;
  // Allow explicitly whitelisted keys
  if (ALLOWED_KEYS.has(e.key)) {
    // Allow only one decimal point
    if (e.key === ".") {
      const input = e.currentTarget;
      if (input.value.includes(".")) {
        e.preventDefault();
      }
      return;
    }
    return;
  }
  // Block everything else (letters, symbols, etc.)
  e.preventDefault();
}

export const numericInputProps = {
  type: "text" as const,
  inputMode: "decimal" as const,
  pattern: "[0-9]*\\.?[0-9]*",
  autoComplete: "off" as const,
  onKeyDown: blockNonNumericKeys,
};
