import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <h1>GraphQL Blog — Web (dev)</h1>;
}

createRoot(document.getElementById("root")!).render(<App />);
