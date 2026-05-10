---
skill_name: " NotebookLM + AntiGravity"
skill_version: "1.0"
author: Ahmed
created: 2026-05-10
tags:
  - skill
  - template
---

# 🎯 Skill:  NotebookLM + AntiGravity

> # NotebookLM + AntiGravity

Enter this into AntiGravity ![👇](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) ​

> Install and set up NotebookLM for me using the notebooklm-py library ([https://github.com/teng-lin/notebooklm-py](https://github.com/teng-lin/notebooklm-py)):
> 
> 1. Install the package with browser support:
> 
> pip install "notebooklm-py[browser]"
> 
> playwright install chromium
> 
> 2. Run the login command to authenticate via browser:
> 
> notebooklm login
> 
> (A Chromium window will open — sign in with your Google account. Make sure you're signed out of any conflicting Google sessions first.)
> 
> 3. Install the Antigravity skill:
> 
> notebooklm skill install antigravity
> 
> 4. Verify everything is working:
> 
> notebooklm list
> 
> Make sure to:
> 
> Use pip if uv isn't available
> 
> Sign out of any existing Google browser sessions before authenticating to avoid conflicts
> 
> Guide me through the Chromium browser login if it opens
> 
> Run notebooklm auth check if anything seems off after login
> 
> Confirm the skill is installed and notebooks are listing correctly at the end

Prompt for Dashboard Generator ![👇](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) ​

## ![🧠](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Automated Meeting Prep Dashboard Generator

> A complete pipeline using NotebookLM to generate deep research, artifacts, and a gorgeous glassmorphic HTML dashboard for meeting prep. Takes a company/meeting context and builds a local presentation website.

## Automated Meeting Prep Framework

This skill dictates how to operate as an elite intelligence analyst and engineer, automatically building a comprehensive web dashboard full of deep-researched artifacts for any upcoming meeting or company target, leveraging the NotebookLM MCP tools.

### ![🎯](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) The Goal

Take a raw input (a company name, domain, and/or meeting context) and transform it into a ready-to-view, high-end "Meeting Prep Dashboard" folder containing:

A suite of AI-generated Markdown documents (briefing, competitive intel, research report, quiz, flashcards).

Downloaded media artifacts (audio podcast MP3, market infographic PNG).

A beautiful, offline-ready HTML dashboard unifying everything for the executive.

### ![⚡](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Trigger Details

Input can come from any of the following sources:

Zapier/Make automation: Watching Google Calendar for new "Discovery Call" events and firing a payload with the company name.

Email/CRM trigger: A new lead or meeting request arriving in an inbox or CRM system.

Manual prompt: The user simply types a company name and meeting context directly.

The input payload should contain at minimum:

company_name

, and optionally:

company_domain

,

meeting_date

,

meeting_type

,

contact_name

,

contact_title

.

## ![🔁](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Step-By-Step Execution Pipeline

### Phase 0: Agent Pre-Research (Data Enrichment)

Before relying on NotebookLM, the autonomous agent must do its own groundwork to create high-quality "seed data." NotebookLM's outputs are only as good as the sources you feed it — garbage in, garbage out.

#### Step 0.1 — Website Scrape

Use web scraping tools (Firecrawl, Exa, Tavily, or Apify via MCP) to read the company's official website. Target these specific pages:

About / Company page

Products / Services / Platform page

Pricing page (if public)

Team / Leadership page

Blog / News / Press page

Careers page (reveals growth stage and tech stack)

#### Step 0.2 — External Enrichment

Search the broader web to find:

LinkedIn company page (employee count, recent posts, hiring activity)

Crunchbase or PitchBook data (funding rounds, investors, valuation)

Recent news articles, press releases, or founder interviews (last 6 months)

Wikipedia page (if it exists)

Glassdoor or similar (company culture signals)

Any YouTube videos featuring the company or its founders

#### Step 0.3 — Synthesize Company Profile

Combine all scraped data into a single, highly distilled "Company Profile" text document. This document should include:

Company name, HQ location, founding year

CEO/founder names and backgrounds

Employee count range

Funding history (rounds, amounts, lead investors)

Revenue model (SaaS, services, hybrid, marketplace)

Core products/services (with brief descriptions)

Key clients or case studies mentioned on their site

Direct competitors (named on their site or obvious from market position)

Recent news highlights (last 2-3 significant events)

The meeting context (why are we meeting them? what do they want from us?)

> ![💡](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) This profile becomes the foundational "seed" for NotebookLM. It ensures the AI never hallucinates because it starts with verified facts.

### Phase 1: Notebook Preparation & Initial Ingestion

This phase creates the isolated knowledge brain for this specific client.

#### Step 1.1 — Create Notebook

mcp: notebook_create title: "Meeting Prep - [Company Name]"

​

#### Step 1.2 — Inject Seed Data as Text Source

mcp: source_add notebook_id: [from step 1.1] source_type: "text" title: "[Company Name] — Company Profile" text: [the synthesized Company Profile from Phase 0.3] wait: true

​

#### Step 1.3 — Add Scraped URLs as Sources

For each high-quality URL found during Phase 0 (company website, Wikipedia, key news articles), add them individually:

mcp: source_add notebook_id: [from step 1.1] source_type: "url" url: "[each URL]" wait: true

​

> ![ℹ️](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Add 3-8 of the best URLs. Don't add more than 10 here — deep research will find more.

### Phase 2: Autonomous Deep Research (NotebookLM Web Search)

This is where NotebookLM's killer feature kicks in — it autonomously searches the web for 40-100+ additional sources about the company and their industry.

#### Step 2.1 — Start Deep Research

mcp: research_start notebook_id: [from step 1.1] query: "[Company Name] competitive landscape market trends [industry] [region] 2025 2026" source: "web" mode: "deep"

​

Use

mode: "deep"

for exhaustive coverage (takes ~5 minutes, finds 40-100+ sources). Use

mode: "fast"

if speed is critical (takes ~30 seconds, finds ~10 sources).

#### Step 2.2 — Poll Until Complete

mcp: research_status notebook_id: [from step 1.1] max_wait: 300

​

Wait for

status: "completed"

before proceeding.

#### Step 2.3 — Batch Import Sources (CRITICAL)

If

mode="deep"

returns a large number of sources (40-110+), importing them all at once WILL cause an MCP timeout error. You MUST batch the imports.

# Import sources 0-19 mcp: research_import notebook_id: [from step 1.1] task_id: [from step 2.1] source_indices: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19] # Import sources 20-39 mcp: research_import source_indices: [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39] # Continue in chunks of 20 until all sources are imported...

​

If using

mode="fast"

, you can safely omit

source_indices

to import all ~10 sources at once.

> ![⚠️](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Important: Wait a few seconds between each batch to let NotebookLM process the incoming sources.

### Phase 3: Artifact Generation & Extraction

Now the notebook has a rich, comprehensive knowledge base. Use NotebookLM's querying and studio features to generate the output artifacts.

#### Step 3.1 — Executive Briefing (

01_briefing_doc.md

)

Use

notebook_query

or

studio_create

(report format) with the following prompt:

> "Create a comprehensive executive pre-meeting briefing document with these exact sections: 1) Company Overview (background, size, leadership, financials, business model, core products, key clients, recent developments, meeting context), 2) Competitive Landscape (name each competitor, their approach, and the client's advantage), 3) Market Opportunity (specific dollar figures, growth rates, and government initiatives), 4) Key Talking Points (numbered, actionable conversation starters), 5) Handling Objections (table format with Objection and Response columns), 6) Recommended Next Steps (3 concrete follow-up actions)."

Save the output as

01_briefing_doc.md

.

#### Step 3.2 — Deep Research Report (

02_deep_research_report.md

)

mcp: notebook_query notebook_id: [from step 1.1] query: "Write a deep research report summarizing the macro trends affecting this company's industry over the next 2 years. Include a table of the top 10 most important sources discovered, with columns for Source Name and Why It Matters. Then summarize the key themes assessed."

​

Save the output as

02_deep_research_report.md

.

#### Step 3.3 — Competitive Intelligence (

03_competitive_intel.md

)

mcp: notebook_query query: "Create a rapid competitive intelligence cheat sheet formatted as: Top 3 Things to Know (each with a bold headline, 3-4 bullet points of evidence, and a 'Your angle' recommendation), followed by a 'Market Numbers to Drop in Conversation' section listing 7-10 specific statistics with dollar signs and percentages."

​

Save the output as

03_competitive_intel.md

.

#### Step 3.4 — Market Infographic (

04_market_infographic.png

)

mcp: studio_create notebook_id: [from step 1.1] artifact_type: "infographic" orientation: "portrait" detail_level: "detailed" confirm: true

​

Poll

studio_status

until the infographic is completed, then:

mcp: download_artifact notebook_id: [from step 1.1] artifact_type: "infographic" output_path: "[prep_folder]/04_market_infographic.png"

​

#### Step 3.5 — Audio Briefing Podcast (

audio_briefing.mp3

)

mcp: studio_create notebook_id: [from step 1.1] artifact_type: "audio" audio_format: "brief" audio_length: "short" confirm: true

​

Poll

studio_status

until the audio is completed, then:

mcp: download_artifact notebook_id: [from step 1.1] artifact_type: "audio" output_path: "[prep_folder]/audio_briefing.mp3"

​

#### Step 3.6 — Knowledge Quiz (

06_pre_call_quiz.md

)

mcp: studio_create notebook_id: [from step 1.1] artifact_type: "quiz" question_count: 8 difficulty: "medium" confirm: true

​

Poll

studio_status

, then download:

mcp: download_artifact artifact_type: "quiz" output_path: "[prep_folder]/06_pre_call_quiz.md" output_format: "markdown"

​

#### Step 3.7 — Flashcards (

07_flashcards.md

)

mcp: studio_create notebook_id: [from step 1.1] artifact_type: "flashcards" difficulty: "medium" confirm: true

​

Poll

studio_status

, then download:

mcp: download_artifact artifact_type: "flashcards" output_path: "[prep_folder]/07_flashcards.md" output_format: "markdown"

​

> ![💡](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Fallback for thin flashcards: If the downloaded flashcards contain fewer than 8 Q&A pairs, automatically run a supplementary
> 
> notebook_query
> 
> :

> "Generate 10 flashcard-style Q&A pairs covering the most important facts someone should memorize before meeting with [Company Name]. Format each as 'Q: [question]' and 'A: [answer]'."

Append these to the flashcards file.

#### Step 3.8 — Slide Deck (

08_slide_deck.pdf

) [Optional]

mcp: studio_create notebook_id: [from step 1.1] artifact_type: "slide_deck" slide_format: "detailed_deck" confirm: true

​

Download as PDF when complete.

### Phase 4: Index File Generation

Create a

00_INDEX.md

file that serves as the table of contents for the prep folder:

# Meeting Prep Package: [Company Name] **Generated:** [timestamp] **Meeting Date:** [date] **Meeting Type:** [type] ## Downloaded Files | # | File | Description | |---|------|-------------| | 1 | 01_briefing_doc.md | Executive pre-meeting briefing | | 2 | 02_deep_research_report.md | Deep research summary with source table | | 3 | 03_competitive_intel.md | Competitive intelligence cheat sheet | | 4 | 04_market_infographic.png | Visual market landscape infographic | | 5 | 06_pre_call_quiz.md | Knowledge test (8 questions) | | 6 | 07_flashcards.md | Rapid-review flashcards | | 7 | audio_briefing.mp3 | AI podcast briefing | | 8 | index.html | Interactive dashboard | ## Cloud Resources - **NotebookLM Notebook:** [link to notebook] - **Research Sources:** [number] web sources analyzed ## How to Use 1. Open `index.html` in your browser for the full interactive experience 2. Or run `python3 -m http.server 8888` in this folder and visit localhost:8888 3. Listen to `audio_briefing.mp3` on your commute 4. Review `01_briefing_doc.md` for a 3-minute text summary

​

### Phase 5: Constructing the Premium HTML Dashboard

Package all artifacts into a single interactive HTML dashboard.

#### Step 5.1 — Create Output Folder

Create a folder named

Meeting Prep - [Company Name]

in the current working directory.

#### Step 5.2 — Build the HTML Dashboard (

index.html

)

The dashboard must include ALL of the following:

Navbar with "Antigravity OS" branding, meeting date badge, and Export PDF button

Header with company name, subtitle, and embedded audio player with animated visualizer bars

Sidebar navigation with 6 tabs: Executive Briefing, Competitive Intel, Deep Research, Knowledge Test, Flashcards, Market Infographic

Content area that dynamically renders markdown content for the first 3 tabs using marked.js

Critical implementation details for the dashboard:

1. Markdown tabs (Briefing, Intel, Research): Store the raw markdown inside

<script type="text/markdown" id="md-[tabname]">

blocks. Use marked.js to parse and render them when the tab is clicked.

2. Quiz tab: Do NOT render via markdown — build an interactive quiz with:

Question cards with clickable radio-button options

Green ✓ / Red ✗ visual feedback on answer selection

Score counter that appears after all questions are answered

Questions sourced from the downloaded quiz file

3. Flashcards tab: Do NOT render via markdown — build an interactive flashcard component with:

3D flip animation (CSS

perspective

+

rotateY(180deg)

)

Purple gradient front (Question), gold accent back (Answer)

Left/right arrow navigation with card counter

Progress dots below the card

Content sourced from the downloaded flashcards file

4. Market Infographic tab: Do NOT render via markdown (the

<img>

tag will get escaped). Render natively with a JS function that returns HTML with the

<img>

tag pointing to

04_market_infographic.png

.

5. Audio player:

<audio>

element pointing to

audio_briefing.mp3

with play/pause toggle button and animated visualizer bars.

6. Styling requirements:

Dark mode: background

#08080c

with purple/blue radial gradients

Glassmorphism:

backdrop-filter: blur(10px)

, transparent white backgrounds, subtle borders

Font: Inter from Google Fonts

Icons: Font Awesome 6

CSS framework: Tailwind CSS via CDN

Markdown styling: Custom CSS for h1-h3, p, ul, li, strong, a, table, th, td within

.markdown-content

#### Step 5.3 — Start Local Server (Optional)

cd "Meeting Prep - [Company Name]" python3 -m http.server 8888 # Then open http://localhost:8888/index.html

​

## ![📐](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Guiding Principles & Constraints

#### ![🔴](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Batch Imports (Non-Negotiable)

Never attempt to bulk-import 100+ sources from deep research at once. Always iterate in chunks of 20 using the

source_indices

parameter. Wait 2-3 seconds between batches.

#### ![🟡](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Fail Gracefully

If

flashcards

studio output is too thin (fewer than 8 cards), automatically regenerate via

notebook_query

with an explicit prompt for 10 Q&A pairs.

If

infographic

generation fails, skip it and note it in the INDEX file. The dashboard should still work without it.

If

audio

generation is still processing after 5 minutes, move on and note it as "generating" in the INDEX.

#### ![🎨](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Aesthetics Are Non-Negotiable

The HTML dashboard must feel premium — dark modes, glassmorphism, smooth transitions, crisp typography, animated elements. It should look like a product, not a prototype. Jack's colour preferences are blue + gold.

#### ![🔐](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Data Isolation

Each client/meeting gets its own NotebookLM notebook. Never reuse notebooks across clients. This prevents data contamination and hallucination.

#### ![🛡️](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Security

Never leak API keys, MCP tokens, or authentication credentials into the HTML dashboard.

All servers are local only (localhost).

Generated content stays on the user's machine unless explicitly shared.

#### ![📁](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) File Naming Convention

All files in the prep folder follow this pattern:

00_INDEX.md 01_briefing_doc.md 02_deep_research_report.md 03_competitive_intel.md 04_market_infographic.png 06_pre_call_quiz.md 07_flashcards.md 08_slide_deck.pdf audio_briefing.mp3 index.html

​

### ![📋](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==) Quick Reference: MCP Tools Used

|Tool|Phase|Purpose|
|---|---|---|
|notebook_create|1|Create isolated client notebook|
|source_add<br><br>(text)|1|Inject synthesized company profile|
|source_add<br><br>(url)|1|Add scraped website URLs|
|research_start|2|Trigger deep web research|
|research_status|2|Poll until research completes|
|research_import|2|Batch-import discovered sources (chunks of 20)|
|notebook_query|3|Generate briefing, intel, and research docs|
|studio_create|3|Generate audio, infographic, quiz, flashcards, slides|
|studio_status|3|Poll until studio artifacts complete|
|download_artifact|3|Download audio/infographic/quiz/flashcards locally|
---

## 📋 When To Use This Skill
- Situation 1 where Gemini should apply this skill
- Situation 2

---

## 🧠 Behavior Instructions

Tell Gemini exactly how to behave when this skill is active:
- Always do X
- Never do Y
- Format output as Z

---

## 📥 Input
What does this skill take as input?

```json
{
  "input_field": "description"
}
```

---

## 📤 Output
What does this skill produce?

```json
{
  "output_field": "description"
}
```

---

## 📝 Example

**Input:**
> User says: "..."

**Output:**
> Gemini responds with: "..."

---

## 🔗 Related Skills
- [[skills/other-skill]]
