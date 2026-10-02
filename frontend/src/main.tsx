import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import "./style.css";

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: "var(--surface)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                  fontSize: 13,
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                },
                success: { iconTheme: { primary: "var(--success)", secondary: "var(--accent-ink)" } },
                error:   { iconTheme: { primary: "var(--error)",   secondary: "var(--surface)"    } },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
