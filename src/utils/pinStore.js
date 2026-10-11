/**
 * PIN account store backed by localStorage.
 *
 * Each account: { id, name, pinHash, isAdmin, isActive, createdAt }
 *
 * PINs are stored as salted SHA-256 hashes, never in plain text. This is a
 * convenience gate for one browser, not real security: anyone with access to
 * the browser can edit localStorage. Shared access control needs a server.
 *
 * Seeded on first run with a default admin account (PIN 0000), which the
 * admin page asks to be changed.
 */

const STORE_KEY = "heras_pin_accounts";
const SALT = "heras-fencing-pin-v1";

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;
export const DEFAULT_ADMIN_PIN = "0000";

export const normalisePin = (pin) => (pin || "").replace(/\D/g, "");

export const hashPin = async (pin) => {
  const data = new TextEncoder().encode(`${SALT}:${normalisePin(pin)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

const validatePin = (pin) => {
  const normalised = normalisePin(pin);
  if (normalised.length < PIN_MIN_LENGTH || normalised.length > PIN_MAX_LENGTH) {
    return `PIN must be ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits.`;
  }
  return "";
};

/* ---------- storage ---------- */

const read = () => {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (accounts) => {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(accounts));
  } catch {
    // storage full or unavailable
  }
};

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const defaultAccounts = async () => [
  {
    id: "admin-default",
    name: "Admin",
    pinHash: await hashPin(DEFAULT_ADMIN_PIN),
    isAdmin: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

/** Accounts from storage, seeding the default admin and hashing any legacy plain-text PINs. */
export const getAccounts = async () => {
  let accounts = read();
  if (!accounts) {
    accounts = await defaultAccounts();
    write(accounts);
    return accounts;
  }
  let migrated = false;
  for (const account of accounts) {
    if (account.pin !== undefined) {
      account.pinHash = await hashPin(account.pin);
      delete account.pin;
      migrated = true;
    }
  }
  if (migrated) write(accounts);
  return accounts;
};

export const getAccountById = async (id) => (await getAccounts()).find((a) => a.id === id) || null;

/** Active account matching the PIN, or null. */
export const findByPin = async (pin) => {
  const hash = await hashPin(pin);
  return (await getAccounts()).find((a) => a.pinHash === hash && a.isActive) || null;
};

/** True while any active admin still uses the default PIN. */
export const defaultAdminPinInUse = async () => {
  const hash = await hashPin(DEFAULT_ADMIN_PIN);
  return (await getAccounts()).some((a) => a.isAdmin && a.isActive && a.pinHash === hash);
};

export const addAccount = async ({ name, pin, isAdmin = false }) => {
  const pinError = validatePin(pin);
  if (pinError) return { error: pinError };
  if (!name || !name.trim()) return { error: "Account name is required." };
  const accounts = await getAccounts();
  const pinHash = await hashPin(pin);
  if (accounts.some((a) => a.pinHash === pinHash)) {
    return { error: "That PIN is already in use." };
  }
  const account = {
    id: uid(),
    name: name.trim(),
    pinHash,
    isAdmin: Boolean(isAdmin),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  write(accounts);
  return account;
};

/** Update name/admin flag, and the PIN when a new one is given. */
export const updateAccount = async (id, { name, pin, isAdmin }) => {
  const accounts = await getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "Account not found." };

  const next = { ...accounts[idx] };
  if (pin !== undefined && pin !== "") {
    const pinError = validatePin(pin);
    if (pinError) return { error: pinError };
    const pinHash = await hashPin(pin);
    if (accounts.some((a) => a.pinHash === pinHash && a.id !== id)) {
      return { error: "That PIN is already in use." };
    }
    next.pinHash = pinHash;
  }
  if (name !== undefined) {
    if (!name.trim()) return { error: "Account name is required." };
    next.name = name.trim();
  }
  if (isAdmin !== undefined) next.isAdmin = Boolean(isAdmin);

  if (!next.isAdmin && accounts[idx].isAdmin && !hasOtherActiveAdmin(accounts, id)) {
    return { error: "At least one active admin is required." };
  }

  accounts[idx] = next;
  write(accounts);
  return next;
};

const hasOtherActiveAdmin = (accounts, id) => accounts.some((a) => a.id !== id && a.isAdmin && a.isActive);

export const toggleActive = async (id) => {
  const accounts = await getAccounts();
  const account = accounts.find((a) => a.id === id);
  if (!account) return { error: "Account not found." };
  if (account.isActive && account.isAdmin && !hasOtherActiveAdmin(accounts, id)) {
    return { error: "At least one active admin is required." };
  }
  account.isActive = !account.isActive;
  write(accounts);
  return account;
};

export const deleteAccount = async (id) => {
  const accounts = await getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "Account not found." };
  if (accounts[idx].isAdmin && !hasOtherActiveAdmin(accounts, id)) {
    return { error: "At least one active admin is required." };
  }
  accounts.splice(idx, 1);
  write(accounts);
  return true;
};
