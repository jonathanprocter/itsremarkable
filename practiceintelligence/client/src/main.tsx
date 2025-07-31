
// Global error handlers
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/globalErrorHandler";
import "./utils/sessionManager";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);