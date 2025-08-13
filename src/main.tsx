import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Your Tailwind + design tokens
import "./index.css";
declare global { interface Window { __CRP_PPLX_KEY?: string } }
window.__CRP_PPLX_KEY = import.meta.env.VITE_PPLX_KEY as string;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
