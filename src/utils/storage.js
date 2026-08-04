const PREFIX = 'arlen-store:'

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    if (raw == null) {
      return fallback
    }
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveState(key, value) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  } catch {
    // Ignore quota / private-mode write failures.
  }
}

export function clearState(key) {
  try {
    localStorage.removeItem(`${PREFIX}${key}`)
  } catch {
    // Ignore.
  }
}
