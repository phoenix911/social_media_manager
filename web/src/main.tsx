import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { SWRConfig } from "swr";
import { swrFetcher } from "@/lib/api";
import { bootTheme } from "@/store/themeStore";
import { initPwa } from "@/lib/pwa";
import { initInstall } from "@/store/installStore";
import "./index.css";

bootTheme();
initPwa();
initInstall();

import App from "./App";
import HomePage from "./pages/Home";
import ProjectDashboard from "./pages/ProjectDashboard";
import TrackDetail from "./pages/TrackDetail";
import DraftEditor from "./pages/DraftEditor";
import AccountsPage from "./pages/Accounts";
import ChannelsPage from "./pages/Channels";
import Owners from "./pages/Owners";
import Reminders from "./pages/Reminders";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Mcp from "./pages/Mcp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/mcp" element={<Mcp />} />
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="channels" element={<ChannelsPage />} />
            <Route path="p/:slug" element={<ProjectDashboard />} />
            <Route path="p/:slug/t/:trackId" element={<TrackDetail />} />
            <Route path="p/:slug/draft/new" element={<DraftEditor mode="new" />} />
            <Route path="p/:slug/draft/:id" element={<DraftEditor mode="edit" />} />
            <Route path="p/:slug/accounts" element={<AccountsPage />} />
            <Route path="p/:slug/channels" element={<AccountsPage />} />
            <Route path="p/:slug/owners" element={<Owners />} />
            <Route path="p/:slug/calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SWRConfig>
  </React.StrictMode>,
);
