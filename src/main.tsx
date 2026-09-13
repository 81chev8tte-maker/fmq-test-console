import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeModeProvider } from "./helpers/themeMode";
import "./global.css";

const root = document.getElementById("root");
if (!root) throw new Error("FMQ Test Console root element not found.");

createRoot(root).render(
  <ThemeModeProvider>
    <App />
  </ThemeModeProvider>,
);
