import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      role="group"
      aria-label="Color theme"
      style={{
        display: "flex",
        gap: 2,
        padding: 3,
        borderRadius: 8,
        background: "var(--raised)",
        border: "1px solid var(--line)",
      }}
    >
      {/* Light button */}
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        aria-pressed={isLight}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          background: isLight ? "var(--accent-soft)" : "transparent",
          color: isLight ? "var(--accent)" : "var(--subtle)",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <Sun style={{ width: 13, height: 13 }} />
        <span>Light</span>
      </button>

      {/* Dark button */}
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        aria-pressed={!isLight}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          background: !isLight ? "var(--accent-soft)" : "transparent",
          color: !isLight ? "var(--accent)" : "var(--subtle)",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <Moon style={{ width: 13, height: 13 }} />
        <span>Dark</span>
      </button>
    </div>
  );
}

// Simple alias export for anything using ThemeToggleSimple
export { ThemeToggle as ThemeToggleSimple };
