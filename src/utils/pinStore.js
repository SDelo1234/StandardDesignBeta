/**
 * PIN account store backed by localStorage.
 *
 * Each account: { id, name, pin, isAdmin, isActive, createdAt }
 *
 * Seeded on first run with a default admin account (PIN 0000)
 * and the original demo account (PIN 1234).
 */

const STORE_KEY = "heras_pin_accounts";

const defaultAccounts = () => [
  {
    id: "admin-default",
    name: "Admin",
    pin: "0000",
    isAdmin: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-default",
    name: "Demo User",
    pin: "1234",
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

/* ---------- helpers ---------- */

const read = () => {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- public API ---------- */

/** Return all accounts (seeds defaults on first call). */
export const getAccounts = () => {
  let accounts = read();
  if (!accounts) {
    accounts = defaultAccounts();
    write(accounts);
  }
  return accounts;
};

/** Look up an account by normalised PIN. Returns the account or null. */
export const findByPin = (pin) => {
  const normalised = (pin || "").replace(/\D/g, "").trim();
  return getAccounts().find((a) => a.pin === normalised && a.isActive) || null;
};

/** Add a new account. Returns the created account or { error }. */
export const addAccount = ({ name, pin, isAdmin = false }) => {
  const normalised = (pin || "").replace(/\D/g, "").trim();
  if (!normalised || normalised.length < 4) {
    return { error: "PIN must be at least 4 digits." };
  }
  if (!name || !name.trim()) {
    return { error: "Account name is required." };
  }
  const accounts = getAccounts();
  if (accounts.some((a) => a.pin === normalised)) {
    return { error: "A PIN with that code already exists." };
  }
  const account = {
    id: uid(),
    name: name.trim(),
    pin: normalised,
    isAdmin: Boolean(isAdmin),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  write(accounts);
  return account;
};

/** Update fields on an existing account. Returns updated account or { error }. */
export const updateAccount = (id, updates) => {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "Account not found." };

  if (updates.pin !== undefined) {
    const normalised = (updates.pin || "").replace(/\D/g, "").trim();
    if (!normalised || normalised.length < 4) {
      return { error: "PIN must be at least 4 digits." };
    }
    if (accounts.some((a) => a.pin === normalised && a.id !== id)) {
      return { error: "A PIN with that code already exists." };
    }
    updates.pin = normalised;
  }
  if (updates.name !== undefined && !updates.name.trim()) {
    return { error: "Account name is required." };
  }

  accounts[idx] = { ...accounts[idx], ...updates };
  write(accounts);
  return accounts[idx];
};

/** Toggle isActive flag. */
export const toggleActive = (id) => {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === id);
  if (!account) return { error: "Account not found." };
  account.isActive = !account.isActive;
  write(accounts);
  return account;
};

/** Delete an account by id. Returns true on success. */
export const deleteAccount = (id) => {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "Account not found." };
  accounts.splice(idx, 1);
  write(accounts);
  return true;
};
