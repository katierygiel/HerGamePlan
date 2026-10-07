import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/cooper-hewitt/400.css";
import "@fontsource/cooper-hewitt/500.css";
import "@fontsource/cooper-hewitt/600.css";
import "@fontsource/cooper-hewitt/700.css";
import "@fontsource/cooper-hewitt/800.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
