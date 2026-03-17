import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/components/layout"
import Overview from "@/pages/Overview"
import Settings from "@/pages/Settings"

// Placeholders for the main views
function SEOHub() { return <div className="text-2xl font-bold">Data & SEO Intelligence</div> }
function ContentEngine() { return <div className="text-2xl font-bold">Content & Social Engine</div> }
function AdsManager() { return <div className="text-2xl font-bold">Paid Acquisition Agent</div> }
function LeadGen() { return <div className="text-2xl font-bold">Outreach & Lead Gen</div> }

export default function App() {
  const [currentPath, setCurrentPath] = useState("/")

  useEffect(() => {
    setCurrentPath(window.location.pathname)

    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const page = useMemo(() => {
    switch (currentPath) {
      case "/seo":
        return <SEOHub />
      case "/content":
        return <ContentEngine />
      case "/ads":
        return <AdsManager />
      case "/leads":
        return <LeadGen />
      case "/settings":
        return <Settings />
      case "/":
      default:
        return <Overview />
    }
  }, [currentPath])

  return (
    <AppLayout currentPath={currentPath}>
      {page}
    </AppLayout>
  )
}
