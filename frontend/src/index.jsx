import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
