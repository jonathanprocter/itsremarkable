import { createRoot } from "react-dom/client";

function MinimalApp() {
  return <div>Hello World</div>;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(<MinimalApp />);