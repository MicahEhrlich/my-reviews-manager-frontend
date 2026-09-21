import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { HttpReviewsManagerService } from "./services/reviewsManager";

const service = new HttpReviewsManagerService();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App service={service} />
    </HashRouter>
  </StrictMode>,
);
