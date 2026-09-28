import { createRoot } from "react-dom/client";
import App from "./App";
import "../ai/styles.css";
import "./styles.css";

createRoot(document.getElementById("performance-root")!).render(<App />);
