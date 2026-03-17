# Culinary Block AI Growth Agent: Overview & Action Items

This document provides a comprehensive breakdown of the newly installed autonomous AI marketing agent located in `/ai-agent`, along with your specific action items to get it fully operational.

---

## 🚀 What the Agent Does

The AI Agent acts as a "100x Growth Operator" designed specifically for the Culinary Block physical + SaaS hybrid model. It runs autonomously in the background via scheduled Python tasks, but features a React **Dashboard** tailored with "Human-in-the-loop" approval gates, meaning it will never spend money or send outbound emails without your explicit approval.

It is split into 5 core modules:

### 1. Data & SEO Intelligence (`core/modules/seo`)
- **Daily Analytics Pull:** Connects to GA4 and Google Search Console to read the top traffic-driving keywords (e.g., "commercial kitchen rental San Jose", "Revent rack oven rental").
- **Content Suggester:** Analyzes keyword intent. If it's bottom-funnel (high conversion), it queues a "Landing Page" draft. If it's top-funnel, it queues an informational "Blog Post" draft.

### 2. Content & Social Engine (`core/modules/content`)
- **Social Hooks:** Automatically uses Claude/Gemini to draft daily X (Twitter) and LinkedIn posts using the `@codyschneiderxx` pain-to-solution copywriting framework.
- **Nurture Sequences:** Generates personalized email drips (e.g., specific to Bakers vs Caterers) highlighting benefits like walk-in freezers or the AI Catering Permit Wizard.

### 3. Paid Acquisition Manager (`core/modules/ads`)
- **ROAS Monitor:** Connects to Meta and Google Ads APIs to continuously review campaign performance.
- **Action Proposer:** If a campaign drops below a profitable ROAS threshold, it queues a "Pause Campaign" action. If a specific keyword is converting highly, it queues an "Increase Bid" action for you to approve in the dashboard.

### 4. Outreach & Lead Gen (`core/modules/outreach`)
- **Scraping Integration:** Connects with Apify to scrape local business directories (like Yelp 'Caterers San Jose') for food entrepreneurs who might need space.
- **Verification & Drafting:** Sends the scraped emails through MillionVerifier to prevent bounces, then uses Claude to draft highly personalized cold emails offering a facility tour.

### 5. Operations Automation (`core/modules/ops`)
- **Waitlist Matcher:** Scans the main `culinary-block` Supabase database for calendar availability. If a user cancels and a station (like `Hood1R`) opens up, it instantly identifies a matching lead on your waitlist and queues an alert email.

---

## 📋 Your Next Steps (Action Items)

To take the agent from its current "Mock Sandbox" state to a fully autonomous production machine, follow these steps:

### 1. Acquire Necessary API Keys
You will need to register for developer access on the following platforms to feed the agent real data:
- [ ] **Google Cloud Platform:** Get credentials for **Google Analytics 4 API** and **Google Search Console API**.
- [ ] **Google Ads:** Apply for a basic Google Ads Developer Token.
- [ ] **Meta for Developers:** Create an app to get an Access Token for the Facebook/Instagram Ads API.
- [ ] **Apify:** Create an account to get an API token for directory scrapers (like Google Maps & Yelp).
- [ ] **MillionVerifier:** Create an account and grab an API key for email validation.
- [ ] **Claude (Anthropic) or Gemini (Google):** Get an API key to power the actual LLM generation engine.

### 2. Enter Keys into the UI Dashboard
- Run the agent locally: `cd /Users/doug/culinary-block/ai-agent && ./start.sh`
- Open your browser to `http://localhost:5173`.
- Navigate to the **Settings** page via the left sidebar.
- Enter your acquired API keys into the Setup Wizard and click "Save & Connect". This updates the backend environment variables.

### 3. Replace the 'Mock' Clients in the Codebase
The codebase currently contains mock endpoints (created so you could demo the UI without API keys). Once your keys are in the dashboard, you (or AI) will need to replace the mocked logic with real SDK calls:
- [ ] Replace `MockGA4Client` in `core/modules/seo/ga4_client.py` with the official `google-analytics-data` library.
- [ ] Replace `MockClaudeClient` in `core/modules/content/claude_client.py` with the official `anthropic` pip package.
- [ ] Update the placeholder logic in the `ads`, `outreach`, and `ops` task files to hit their respective live REST APIs.

### 4. Deploy the Agent
Once the local testing is complete and the real APIs are connected, you'll need to deploy the infrastructure:
- **Frontend Panel:** Deploy the `/ai-agent/dashboard` folder to **Vercel** (this acts exactly like the main Next.js app deployment).
- **Backend Service:** Deploy the Python FastAPI backend to **Render**, **Fly.io**, or **Google Cloud Run**. Ensure you attach a managed **Redis** instance to this deployment, as Celery relies on Redis to schedule and execute the daily cron jobs.
