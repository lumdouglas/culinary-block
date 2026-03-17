import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppLayout from "@/components/layout"
import Overview from "@/pages/Overview"
import Settings from "@/pages/Settings"

// Placeholders for the main views
function SEOHub() { return <div className="text-2xl font-bold">Data & SEO Intelligence</div> }
function ContentEngine() { return <div className="text-2xl font-bold">Content & Social Engine</div> }
function AdsManager() { return <div className="text-2xl font-bold">Paid Acquisition Agent</div> }
function LeadGen() { return <div className="text-2xl font-bold">Outreach & Lead Gen</div> }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/seo" element={<SEOHub />} />
          <Route path="/content" element={<ContentEngine />} />
          <Route path="/ads" element={<AdsManager />} />
          <Route path="/leads" element={<LeadGen />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
