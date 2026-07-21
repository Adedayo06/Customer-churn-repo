import { useTheme } from "../theme/ThemeContext";

// `variant="icon"` renders a compact icon-only button (used on auth screens);
// default renders a full-width labelled button (used in the sidebar).
export default function ThemeToggle({ variant = "full" }) {
  const { isDark, toggle } = useTheme();
  const label = isDark ? "Light mode" : "Dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      className={"theme-toggle" + (variant === "icon" ? " theme-toggle-icon" : "")}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
      {variant !== "icon" && <span>{label}</span>}
    </button>
  );
}
