// Frontend-only MOCK auth. Users live in localStorage. This is a demo login,
// NOT real security — passwords are stored in plain text in the browser.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const USERS_KEY = "cc_users";
const SESSION_KEY = "cc_session";

// Seed a default admin so the "log in as admin" option works out of the box.
const DEFAULT_ADMIN = {
  username: "admin",
  email: "admin@churn.local",
  password: "admin123",
  role: "admin",
  createdAt: new Date().toISOString(),
};

function loadUsers() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (!raw.some((u) => u.role === "admin")) raw.unshift(DEFAULT_ADMIN);
    return raw;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => saveUsers(users), [users]);
  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  function signup({ username, email, password }) {
    const uname = username.trim().toLowerCase();
    if (!uname || !password) throw new Error("Username and password are required.");
    if (users.some((u) => u.username === uname))
      throw new Error("That username is already taken.");
    const newUser = {
      username: uname,
      email: email.trim(),
      password,
      role: "analyst", // self-signup always creates analysts
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    const { password: _pw, ...safe } = newUser;
    setUser(safe);
    return safe;
  }

  function login({ username, password, role }) {
    const uname = username.trim().toLowerCase();
    const found = users.find((u) => u.username === uname);
    if (!found || found.password !== password)
      throw new Error("Invalid username or password.");
    if (role && found.role !== role)
      throw new Error(
        `This account is not ${role === "admin" ? "an admin" : "an analyst"} account.`
      );
    const { password: _pw, ...safe } = found;
    setUser(safe);
    return safe;
  }

  function logout() {
    setUser(null);
  }

  // --- admin helpers -------------------------------------------------------
  function listAnalysts() {
    return users.filter((u) => u.role === "analyst");
  }
  function removeAnalyst(username) {
    setUsers((prev) => prev.filter((u) => u.username !== username));
  }

  const value = useMemo(
    () => ({ user, users, signup, login, logout, listAnalysts, removeAnalyst }),
    [user, users]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
