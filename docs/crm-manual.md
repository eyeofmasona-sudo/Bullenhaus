# CRM Manual — All Roles

This manual describes the user-facing functionality of the Bullenhaus CRM and what each confirmed role can do. The CRM has four roles: **Admin**, **Director**, **Manager**, and **Agent**. The sidebar adapts to the role of the signed-in user.

---

## Global Interface

### Purpose
A consistent shell around every CRM page so users always know status, identity, and where they are.

### What it shows
- **System status bar:** "System Status: Online", latency (e.g., 12ms), and "Trading Engine Connected".
- **AI Core indicator:** Pulsing green "AI CORE ACTIVE" badge in the header.
- **User profile block:** Role initials, role name, an "Aura Account" label, and a Logout button.
- **Toast notifications:** Periodic global alerts such as Margin Call warnings or "FTD processed" success messages.

### What it includes
A left sidebar (the "Command Center"), a top header, and the main content area.

### How it works
The sidebar shows only the sections allowed for the signed-in role. Logout from the bottom of the sidebar ends the session.

---

## Director Dashboard

### Purpose
A high-level monitoring view of overall CRM and platform health.

### What it shows
- **KPI cards:** Active Clients, Total Deposits, Net Capital Flow (deposits minus withdrawals), CRM Team (total online specialists).
- **AI Core Insights banner:** Live counts of registered clients, active CRM roles, and net capital flow.
- **Capital Flow chart:** Area chart of Deposits vs. Withdrawals over the last 7 days.
- **CRM Team list:** Active specialists with full name, role, and a green "Online" indicator.

### What it includes
KPI tiles, an insights banner, the 7-day capital flow chart, and the team roster.

### How it works
The page is primarily read-only. It refreshes the KPIs, chart, and team list so a director can monitor activity at a glance.

---

## Manager Dashboard

### Purpose
Lets a manager monitor team composition, activity, and recent deposit performance.

### What it shows
- **KPI strip:** Total Deposits, Active Clients, Team Size (count of managers and agents).
- **Team Roster table:** Name, Role (color-coded badges), Email, Status (Active/Online).
- **Call Volume Trend:** Area chart of call volume across the working day (08:00 to 18:00).
- **Quick Stats sidebar:** Counts of Agents, Managers, Clients, and Total Deposits.

### What it includes
The KPI strip, team roster, call volume chart, quick stats sidebar, and an **Export** button for the team roster.

### How it works
Browse the roster and KPIs to see how the team is performing. Use **Export** to download the team roster.

---

## Agent Workspace

### Purpose
The day-to-day cockpit for an agent: featured lead, AI guidance, tasks, and pipeline.

### What it shows
- **Stats bar:** Leads Today, FTD (First Time Deposits) Today.
- **Featured Lead panel:** Most urgent lead with Name, Stage, Source, Capacity, and Email.
- **AI Next Best Action:** Context-aware advice for the featured lead (e.g., "Begin with an introduction call…").
- **Task Queue:** Upcoming tasks (Urgent Calls, Follow-ups) with timeframes and urgency indicators.
- **Lead Pipeline:** Kanban view grouped by stage — **New Inquiries**, **In Discussion**, **Pending KYC**, **Funded (FTD)**. Each card shows capacity, added date, and quick action icons.

### What it includes
- **Notes** and **Call Now** buttons on the featured lead.
- Quick action icons on each pipeline card for notes and calls.
- **+ New** button that opens a task creation modal (Lead Name, Type, Time, Notes).

### How it works
The featured lead and AI advice surface what to do next. Work through the Task Queue, advance leads through the pipeline stages, and create new tasks with the **+ New** button.

---

## Call Center

### Purpose
A guided workspace for running outbound calls and logging outcomes.

### What it shows
- **Dialer status bar:** "Ready Dialer" status and the number of leads in the queue.
- **Active Call Workspace:** Call timer, lead initials, name, and phone number.
- **AI Script:** Recommended approach based on the lead's stage (e.g., "Focus on next steps — KYC documents").
- **Call Queue sidebar:** The next 6 leads with their priority number and type (New Inquiry / Follow-up).
- **Pulse Chart:** Small real-time chart of call volume.

### What it includes
- Call controls: **Mute**, **End Call** (red), **Settings**.
- **Wrap-Up modal** that appears after ending a call to log:
  - **Call Outcome:** Interested/FTD, Call Back, Not Interested, No Answer.
  - **AI Summary Notes** (free text).

### How it works
The next lead is shown automatically. Use the AI script as guidance, run the call with the dialer controls, and after ending the call fill in the wrap-up modal to record the outcome and notes.

---

## VIP Clients

### Purpose
Browse and work with high-value clients in detail.

### What it shows
- **Top filter bar:** Keyword search and tier filters — **All**, **Titanium**, **Platinum**, **Silver**.
- **Client cards:** Initials, name (star icon for Titanium), tier, registration date, balance, KYC status, and a **Churn Risk** badge when the risk is CRITICAL.

### What it includes
A side **Client Drawer** with three tabs:
- **Overview:** Contact details (with email unmasking toggle), Balance, KYC status, plus **Start Secure Call** and **Draft Encrypted Email** buttons.
- **Transactions:** Summary of Balance / Deposited / Withdrawn and a list of all transactions (type, date, amount, status).
- **KYC:** Detailed KYC status and account tier info.

### How it works
Search or filter to find a client, click a card to open the drawer, and switch tabs to view contact, transactional, or KYC information. Use the action buttons in the Overview tab to start a call or draft an email.

---

## Reports

### Purpose
Review month-to-date business performance and export reports.

### What it shows
- **Summary KPIs (MTD):** Total Deposits, Net Revenue, Active Clients.
- Three selectable report views:
  - **Revenue Growth** — area chart of deposits vs. withdrawals over 6 months.
  - **Agent Performance** — table of Agent, Calls, Conversions, Conversion Rate, FTD Volume.
  - **VIP Churn Analysis** — pie chart of churn reasons (Market Volatility, Better Offer, etc.) with AI insights.

### What it includes
The summary KPI strip, three report selection cards, the active report view, and an **Export PDF** button.

### How it works
Click one of the three report cards to load that report. Use **Export PDF** to download the currently active report.

---

## Trading Intelligence

### Purpose
Surface platform-wide trading risk signals and recent sync activity from the trading platform.

### What it shows
- **Market Metrics cards:** Total Trading AUM, Synced Traders, Pending KYC Reviews, Critical Churn Risks.
- **Platform Exposure chart:** Combined view of Traded Volume (bars) and Avg Margin Level (line).
- **AI Core Alerts:** Warning box for critical events (e.g., "Margin calls are accelerating in XAU/USD").
- **Top Liquidations:** List of the largest month-to-date liquidations by asset pair.
- **Recent Registrations:** Table of synced clients showing Trading ID, Balance, Tier, KYC Status, Risk Score, and Sync Time.

### What it includes
Action buttons on AI Core Alerts: **Initiate Auto-Close** and **Ignore**.

### How it works
Monitor the metrics and chart for risk signals. When an alert appears, choose **Initiate Auto-Close** to act or **Ignore** to dismiss it. Review recent registrations to see who has just synced from the trading platform.

---

## Advertisers

### Purpose
Manage advertising partners and their referral codes.

### What it shows
- **Stats summary:** Total Advertisers, Active advertisers, total Referral Codes.
- **Advertiser list:** Expandable rows showing status, name, and number of codes.

### What it includes
- **Expanded view per advertiser:** Stats for Registrations, Deposits, Volume, and Active Traders, plus a list of referral codes with their campaign names.
- **New Advertiser modal** (fields: Name, Description).
- **Add Code modal** for a specific advertiser (fields: Code, Campaign Name).

### How it works
Expand any advertiser to see its detailed stats and codes. Use **New Advertiser** to register a partner, and **Add Code** within an advertiser to attach a new referral code and campaign.

---

## Data Management

### Purpose
Import and export data for clients, leads, and CRM users, with a record of every action.

### What it shows
- Module selector: **Clients**, **Leads**, **Users**.
- An **Audit Trail** sidebar logging all import/export actions with timestamps and user emails.

### What it includes
- **Export Actions:** Choose format (CSV or XLSX) and click **Export File**.
- **Import Actions:** Choose a duplicate rule (Skip or Update), select a file via a drag-and-drop zone, then click **Import File**.

### How it works
Pick the module, then either export by selecting the file format or import by choosing the duplicate rule and dropping in a file. Every action is recorded in the Audit Trail.

---

## Admin Panel (CRM)

### Purpose
Manage CRM worker accounts — create new operators, change their role, reset passwords, or remove them.

### What it shows
A worker table with columns: **Name / Email**, **Role** (Admin, Director, Manager, Agent), **Date Added**.

### What it includes
- Keyword search and a role dropdown filter.
- Per-worker action buttons: **Edit** (Name / Role), **Reset Password**, **Delete**.
- **Add Worker** modal (Full Name, Email, Password, Role).
- KPI tiles showing Total Workers and counts by role group.

### How it works
Use search and the role filter to locate a worker. Click **Add Worker** to create a new operator with their starting credentials and role. Use the per-row buttons to edit details, reset the password, or delete the worker.

---

# Roles

## Admin

### Accessible sections
- Admin Panel (CRM)
- A "Switch Zone" section in the sidebar linking to the **Trade Platform** and the **Admin Panel** (the trading platform's admin area)

### What the role sees
The CRM Admin Panel as the main working area, and quick-switch links to other zones in the sidebar.

### What the role can do
- Create, edit, and delete CRM workers.
- Change a worker's role.
- Reset a worker's password.
- Search and filter the worker list.
- Switch to the Trade Platform or the trading Admin Panel from the sidebar.

---

## Director

### Accessible sections
- Director Dashboard
- VIP Clients
- Manager Dashboard

### What the role sees
A monitoring-focused dashboard with platform KPIs, capital flow, the CRM team list, and access to the VIP client base and the Manager Dashboard view.

### What the role can do
- Review high-level platform KPIs and the capital flow chart.
- See the online CRM team.
- Browse VIP clients, open their profiles, view contact information, transactions, and KYC details, and trigger **Start Secure Call** or **Draft Encrypted Email**.
- Open the Manager Dashboard to see team composition and call activity, and export the team roster.

---

## Manager

### Accessible sections
- Manager Dashboard
- Team Pipeline (workspace view)
- Director Dashboard

### What the role sees
The Manager Dashboard with team KPIs, roster, call volume, and quick stats; plus access to the team's lead pipeline workspace and the Director Dashboard view.

### What the role can do
- Review team KPIs, roster, call volume, and quick stats.
- Export the team roster.
- Open the Team Pipeline workspace to monitor leads in their stages.
- Open the Director Dashboard view for higher-level metrics.

---

## Agent

### Accessible sections
- Agent Workspace
- Manager Dashboard

### What the role sees
The Agent Workspace with the featured lead, AI next-best-action guidance, task queue, and personal lead pipeline; plus access to the Manager Dashboard view.

### What the role can do
- Work the featured lead using **Notes** and **Call Now**.
- Follow AI next-best-action recommendations.
- Track and complete tasks in the Task Queue.
- Create new tasks via the **+ New** button (Lead Name, Type, Time, Notes).
- Move leads through the pipeline stages (New Inquiries, In Discussion, Pending KYC, Funded).
- Open the Manager Dashboard view.

---

# Information Gaps

- Whether the **Call Center** page is available to specific roles (Agent, Manager, etc.) is not described by the role-based sidebar configuration reviewed.
- Whether the **VIP Clients**, **Reports**, **Trading Intelligence**, **Advertisers**, and **Data Management** pages appear in any role's sidebar (beyond Director's VIP Clients access) is not specified — the sidebar nav defines Director, Manager, Agent, and Admin entries that do not list these pages directly.
- The exact behavior of the dialer in **Call Center** (how a call is initiated or whether numbers are dialed automatically) is not described.
- Whether **Start Secure Call** and **Draft Encrypted Email** in VIP Clients launch an external tool or an in-app workflow is not described.
- How **Initiate Auto-Close** in Trading Intelligence executes (which positions are closed and under what rule) is not described.
- Permissions for who can run **Import / Export** in Data Management are not described.
- Whether Director, Manager, or Agent can see or trigger the **Switch Zone** links is not described — only Admin's Switch Zone is confirmed.
