import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function Settings() {
  const integrations = [
    { name: "Google Ads API", status: "disconnected", desc: "For automated campaign creation and budget management." },
    { name: "Google Analytics 4", status: "connected", desc: "For tracking conversion performance and keyword data." },
    { name: "Google Search Console", status: "disconnected", desc: "For auto-generating landing pages based on search trends." },
    { name: "Meta Ads (Facebook/IG)", status: "disconnected", desc: "For continuous remarketing and lookalike waitlist audiences." },
    { name: "X (Twitter) API", status: "disconnected", desc: "Required for the social engine to auto-post hooks." },
    { name: "LinkedIn API", status: "disconnected", desc: "Required for the social engine professional posts." },
    { name: "Apify", status: "disconnected", desc: "For scraping local business directories for lead gen." },
    { name: "MillionVerifier", status: "disconnected", desc: "To verify scraped email addresses before outreach." },
    { name: "Anthropic Claude", status: "connected", desc: "Primary LLM for copy generation and strategic decisions." }
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Setup Wizard</h1>
        <p className="text-slate-500 mt-1">Configure your API keys to enable autonomous growth functions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration, idx) => (
          <Card key={idx} className={integration.status === "connected" ? "border-teal-200" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                {integration.status === "connected" ? (
                  <span className="flex items-center text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Missing Key
                  </span>
                )}
              </div>
              <CardDescription>{integration.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {integration.status === "disconnected" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">API Key / Access Token</label>
                  <input 
                    type="password" 
                    placeholder="Paste secret key here..."
                    className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}
            </CardContent>
            {integration.status === "disconnected" && (
              <CardFooter className="pt-0">
                <Button size="sm" variant="secondary" className="w-full">Save & Connect</Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
