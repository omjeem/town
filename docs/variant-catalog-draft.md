# Variant Catalog Draft

A first opinionated pass at the variant taxonomy for town-next. `office.hacker-cabin` is the
locked anchor for WORK; everything below extends from it.

The tone target throughout: shop signs in Animal Crossing crossed with storefront names in
Stardew Valley. Concrete, warm, recognizably about *this* person. Canonical names below
are the **catalog defaults** — the curator may riff a possessive version per user at render
time. See `apps/web/src/lib/curator/prompt.ts` for the full tone bible.

---

## 1. OFFICE / WORK plot variants

Each maps a working archetype CORE is likely to recognise. After the OFFICE/PRACTICE/WORKSHOP split (see §§ 2–4 below), OFFICE itself holds the desk-shaped knowledge-work archetypes: hacker-cabin, drafting-table, writing-room, whiteboard-room, field-notes, two-by-two-table, the-trading-floor, sticky-wall, the-classroom, pivot-table, pitch-wall, the-headset-desk, desk-by-the-window.

---

### `office.hacker-cabin` (LOCKED)

- **Sign name (canonical):** "The Hacker Cabin"
- **Sign name (LLM riff examples):** `"Harshith's Hacker Cabin"`, `"The Late Shift"`, `"Build Room"`
- **Profession / archetype:** software engineer / programmer
- **Vibe (sensory):** dim, focused, terminal-green. A single warm desk lamp, mechanical clack, ambient hum of a tower under the desk.
- **Exterior sprite candidate(s):** `exteriors/office/condo-9.png`, `exteriors/office/condo-8.png` (compact, narrow urban block)
- **Interior sprite candidate(s):** `interiors/office/office-design-1.gif` (open-floor as base) — needs composition pass to feel like a private cabin rather than open-plan
- **Palette accent hex:** `#7b8a34` (olive terminal-green)
- **Interior anchor objects (3-5):** dual-monitor workstation, mechanical keyboard, whiteboard with arrows, cold coffee mug, snake plant
- **NPC archetype:** Hooded silhouette at the keyboard, hunched but unhurried. Glasses catch the screen. Doesn't look up immediately when you enter — finishes the line first.
- **NPC opening line examples (3):**
  - "Give me a sec — pushing this branch."
  - "Coffee's cold. Code's compiling. Take a seat."
  - "I think the bug's in the cache. It's always the cache."
- **Slot bindings (3-5):**
  - `wall_poster: github.top_starred_repo.cover`
  - `desk_item: github.current_pr.title`
  - `bookshelf_top_row: github.top_languages`
  - `npc_greeting: github.recent_commit_message`
  - `whiteboard: linear.current_cycle_focus`
- **Trigger signals (3-5):**
  - `has_integration: "github"`
  - `has_aspect: { aspect: "Habit", matches: "ship code" }`
  - `has_aspect: { aspect: "Goal", matches: "learning <language>" }`
  - `label_name_matches: /engineering|programming|code|side projects/i`
  - `metric: { key: "github.commits_last_30d", op: ">", value: 30 }`

---

### `office.drafting-table`

- **Sign name (canonical):** "The Drafting Table"
- **Sign name (LLM riff examples):** `"Harshith's Drafting Table"`, `"Pixel Pushing Hours"`, `"The Tracing Room"`
- **Profession / archetype:** designer (product / UI / graphic)
- **Vibe (sensory):** bright, paper-warm, intentional. Tilted desk, charcoal smudge, the smell of fresh markers.
- **Exterior sprite candidate(s):** `exteriors/office/condo-6.png` (mid-rise office vibe)
- **Interior sprite candidate(s):** needs composition — closest base is `interiors/office/office-design-2.gif` with art surfaces overlaid
- **Palette accent hex:** `#c9744a` (terracotta marker)
- **Interior anchor objects (3-5):** angled drafting table, color swatch wall, Wacom tablet, jar of pens, oversized monitor turned vertically
- **NPC archetype:** Sleeves rolled, ink on one wrist, glasses pushed up onto forehead. Studies you the same way they study a wireframe.
- **NPC opening line examples (3):**
  - "Hang on — what does this label feel like to you, honestly?"
  - "Five-pixel grid today. Everything's gone soft otherwise."
  - "Pick a swatch. I trust your eye more than mine right now."
- **Slot bindings (3-5):**
  - `wall_poster: figma.recent_file.thumbnail`
  - `desk_item: figma.current_project.name`
  - `swatch_wall: figma.recent_palette`
  - `npc_greeting: figma.recent_file.title`
  - `whiteboard: linear.current_design_review`
- **Trigger signals (3-5):**
  - `has_integration: "figma"`
  - `has_aspect: { aspect: "Habit", matches: "design" }`
  - `label_name_matches: /design|ux|ui|visual/i`
  - `metric: { key: "figma.files_touched_last_30d", op: ">", value: 5 }`
  - `has_aspect: { aspect: "Goal", matches: "ship.*design" }`

---

### `office.writing-room`

- **Sign name (canonical):** "The Writing Room"
- **Sign name (LLM riff examples):** `"Harshith's Writing Room"`, `"Draft Three"`, `"Margins"`
- **Profession / archetype:** writer / journalist / essayist
- **Vibe (sensory):** quiet, paper-strewn, bookish. Single typewriter-style keyboard, stack of half-edited drafts, lamp at low angle.
- **Exterior sprite candidate(s):** `exteriors/office/condo-example.png`
- **Interior sprite candidate(s):** needs composition — wood-paneled small office with bookshelf
- **Palette accent hex:** `#5a6b8a` (ink blue)
- **Interior anchor objects (3-5):** narrow writing desk, single-page typewriter or laptop, stack of legal pads, coffee ring on the desk, framed pull-quote on the wall
- **NPC archetype:** Cardigan, mug perpetually in one hand, half-finished sentence on the screen. Reads slowly, then nods.
- **NPC opening line examples (3):**
  - "Two thousand words and most of them earn their keep today."
  - "What's the lede? You don't have to know it yet — just guess."
  - "Editing's where the real writing happens. Have a seat."
- **Slot bindings (3-5):**
  - `wall_poster: substack.recent_post.cover` or `notion.recent_doc.preview`
  - `desk_item: notion.current_draft.title`
  - `bookshelf_top_row: goodreads.recent_reads`
  - `npc_greeting: substack.recent_post.title`
  - `pinboard: notion.recent_tags`
- **Trigger signals (3-5):**
  - `has_integration: "substack"` or `has_integration: "notion"`
  - `has_aspect: { aspect: "Habit", matches: "writes|writing|essays|newsletter" }`
  - `label_name_matches: /writing|essays|drafts|newsletter/i`
  - `metric: { key: "substack.posts_last_90d", op: ">=", value: 2 }`
  - `has_aspect: { aspect: "Goal", matches: "publish|finish.*book" }`

---

### `office.whiteboard-room`

- **Sign name (canonical):** "The Whiteboard Room"
- **Sign name (LLM riff examples):** `"Harshith's Whiteboard Room"`, `"The Front Office"`, `"Week 14"`
- **Profession / archetype:** founder / exec / CEO
- **Vibe (sensory):** lean, momentum-tracking, slightly chaotic. Whiteboard with arrows, Slack-pings ambient, runway chart taped over a window.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-2.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-2.gif`
- **Palette accent hex:** `#d04a3a` (signal red)
- **Interior anchor objects (3-5):** standing desk, runway whiteboard, big map of customers, single phone on the desk, framed first-customer thank-you
- **NPC archetype:** Hoodie, headset on neck, half-eaten lunch. Stands more than they sit. Eyes flick to their inbox every 30 seconds but they catch themselves.
- **NPC opening line examples (3):**
  - "Two fires this morning. Both manageable. What's up?"
  - "I'm rewriting the deck. Tell me what's confusing in 30 seconds."
  - "Hiring's the bottleneck. It's always hiring."
- **Slot bindings (3-5):**
  - `wall_chart: linear.cycle_burndown`
  - `desk_item: linear.current_milestone`
  - `pinboard: notion.okr_doc`
  - `npc_greeting: linear.recent_shipped`
  - `phone_screen: slack.recent_channel_summary`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Goal", matches: "shipping|building|company|startup|raise" }`
  - `has_aspect: { aspect: "Belief", matches: "ship" }`
  - `label_name_matches: /founder|exec|company|fundraising|hiring/i`
  - `has_integration: "linear"` AND `has_integration: "slack"`
  - `metric: { key: "calendar.meetings_last_7d", op: ">", value: 20 }`

---

### `office.field-notes`

- **Sign name (canonical):** "Field Notes"
- **Sign name (LLM riff examples):** `"Harshith's Field Notes"`, `"The Notebook Wall"`, `"Reading Group of One"`
- **Profession / archetype:** researcher / academic
- **Vibe (sensory):** paper-stacked, citation-heavy, quietly obsessive. Stacks of papers with highlighter halos, three notebooks open at once.
- **Exterior sprite candidate(s):** `exteriors/library/clock-tower-2.png` (civic landmark) or `exteriors/office/condo-6.png`
- **Interior sprite candidate(s):** needs composition — book-walled room with central desk
- **Palette accent hex:** `#6e5a3a` (manila folder)
- **Interior anchor objects (3-5):** standing-height bookshelf wall, citation cards pinned to a corkboard, microscope or instrument-of-the-field on a side table, half-graded papers, kettle
- **NPC archetype:** Wool jumper, pencil behind ear, three browser tabs of PDFs. Patient. Loves when you ask the obvious question.
- **NPC opening line examples (3):**
  - "I think the literature's wrong on this. Tell me where I'm being naive."
  - "I'm chasing a footnote down to 1973. Want to read it with me?"
  - "Coffee's on. The kettle's been on for hours, actually."
- **Slot bindings (3-5):**
  - `wall_pinboard: zotero.recent_citations`
  - `desk_item: notion.current_paper.title`
  - `bookshelf_top_row: goodreads.academic_shelf`
  - `npc_greeting: arxiv.recent_save`
  - `whiteboard: notion.research_questions`
- **Trigger signals (3-5):**
  - `has_integration: "zotero"` or `has_integration: "arxiv"`
  - `has_aspect: { aspect: "Habit", matches: "reads.*papers|research" }`
  - `has_aspect: { aspect: "Goal", matches: "PhD|publish.*paper|thesis" }`
  - `label_name_matches: /research|papers|phd|academia/i`
  - `metric: { key: "zotero.items_last_30d", op: ">", value: 10 }`

---

### `office.two-by-two-table`

- **Sign name (canonical):** "The Two-by-Two Table"
- **Sign name (LLM riff examples):** `"Harshith's Two-by-Two"`, `"The Consult Desk"`, `"Slide 14"`
- **Profession / archetype:** consultant / strategist
- **Vibe (sensory):** clean, slide-deck open, two coffees on the table. Single big-monitor on a clean desk, a paperback management book face-down.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-1.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-1.gif` (open-floor)
- **Palette accent hex:** `#4a6a8a` (powder blue)
- **Interior anchor objects (3-5):** clean wide desk, single big monitor, framed engagement letter or org chart, whiteboard with 2x2 matrix, water carafe
- **NPC archetype:** Smart casual, slight tan, calm voice. Asks more questions than they answer.
- **NPC opening line examples (3):**
  - "Two-by-two on the whiteboard. Tell me which axis is wrong."
  - "Three slides. That's all the meeting will tolerate."
  - "I'm between clients. Now's a good time."
- **Slot bindings (3-5):**
  - `whiteboard: notion.current_engagement.frameworks`
  - `desk_item: notion.client_list.active`
  - `wall_chart: notion.org_chart_of_record`
  - `npc_greeting: calendar.next_client_meeting`
  - `bookshelf_top_row: goodreads.business_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "strategy|consult|advising" }`
  - `label_name_matches: /consulting|strategy|clients|engagements/i`
  - `has_aspect: { aspect: "Goal", matches: "partner|practice|book of business" }`
  - `metric: { key: "calendar.external_meetings_last_7d", op: ">", value: 15 }`
  - `has_integration: "linkedin"` AND high signal weight

---

### `office.the-trading-floor`

- **Sign name (canonical):** "The Trading Floor"
- **Sign name (LLM riff examples):** `"Harshith's Trading Floor"`, `"The Pit"`, `"Open at Nine"`
- **Profession / archetype:** finance / trader / quant
- **Vibe (sensory):** six monitors, ticker-tape green, market-open jitter. Coffee cup with dried rings, Bloomberg-style chart on the wall.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-2.png`
- **Interior sprite candidate(s):** needs composition — multi-monitor wall, single chair
- **Palette accent hex:** `#1a8a3a` (P&L green)
- **Interior anchor objects (3-5):** six-monitor bank, ticker chart wall, fast keyboard, single high-end chair, framed first-trade printout
- **NPC archetype:** Fleece vest, glasses reflecting price tickers, hand on a hotkey. Talks in chart shapes.
- **NPC opening line examples (3):**
  - "Two minutes to close. Hold that thought."
  - "Bonds are weird today. Equities are louder."
  - "I'm flat. Take the chair next to me."
- **Slot bindings (3-5):**
  - `monitor_wall: notion.watchlist`
  - `framed_print: notion.first_trade_note`
  - `desk_item: notion.daily_pnl`
  - `npc_greeting: notion.market_open_note`
  - `pinboard: notion.research_calls`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "trade|market.*open|portfolio" }`
  - `label_name_matches: /trading|markets|finance|portfolio|quant/i`
  - `has_aspect: { aspect: "Goal", matches: "fund|prop|trade" }`
  - `has_integration: "bloomberg"` or `"interactive_brokers"` (if available)
  - `metric: { key: "calendar.market_hours_focus_last_7d", op: ">", value: 30 }`

---

### `office.sticky-wall`

- **Sign name (canonical):** "The Sticky Wall"
- **Sign name (LLM riff examples):** `"Harshith's Sticky Wall"`, `"Spec Review"`, `"PM Corner"`
- **Profession / archetype:** product manager
- **Vibe (sensory):** sticky-note dense, calm, schedule-shaped. Big calendar grid wall, three open notebooks, single big monitor.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-1.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-1.gif`
- **Palette accent hex:** `#e8a83a` (sticky-note yellow)
- **Interior anchor objects (3-5):** roadmap wall with stickies, single big monitor, dense notebook open mid-page, mug with team logo, framed customer quote
- **NPC archetype:** Cardigan over a tee, pen tucked behind ear, friendly. Asks "why" twice before they answer.
- **NPC opening line examples (3):**
  - "Walk me through what the user is actually trying to do."
  - "Q3's almost shape — help me cut one thing."
  - "Spec review at four. Got time to pre-read?"
- **Slot bindings (3-5):**
  - `wall_roadmap: linear.cycle_roadmap`
  - `desk_item: linear.current_spec.title`
  - `framed_quote: notion.customer_quotes.recent`
  - `npc_greeting: linear.recent_shipped`
  - `pinboard: notion.research_notes`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "spec.*writing|product.*review|PM" }`
  - `label_name_matches: /product|roadmap|specs|features/i`
  - `has_aspect: { aspect: "Goal", matches: "ship|launch.*product" }`
  - `has_integration: "linear"` AND `has_integration: "notion"`
  - `metric: { key: "linear.specs_last_30d", op: ">", value: 3 }`

---

### `office.the-classroom`

- **Sign name (canonical):** "The Classroom"
- **Sign name (LLM riff examples):** `"Harshith's Classroom"`, `"Office Hours"`, `"Chalk and Chairs"`
- **Profession / archetype:** teacher / educator
- **Vibe (sensory):** warm wood, chalk dust, kid-art on the wall. Single teacher's desk, ring of chairs, lesson plans face-up.
- **Exterior sprite candidate(s):** `exteriors/library/school-1.png`
- **Interior sprite candidate(s):** needs composition — small classroom with desk + chalkboard
- **Palette accent hex:** `#c47a3a` (warm autumn wood)
- **Interior anchor objects (3-5):** chalkboard with the day's agenda, teacher's desk, ring of student chairs, kid-drawn poster, well-thumbed lesson plan book
- **NPC archetype:** Cozy sweater, chalk on one hand, kind eyes that don't miss much. Already thinking about tomorrow's lesson.
- **NPC opening line examples (3):**
  - "Sit anywhere. You're not late — we haven't started."
  - "Today we're trying something new. Tell me if it lands."
  - "Office hours are now. Talk."
- **Slot bindings (3-5):**
  - `chalkboard: notion.lesson_today`
  - `wall_poster: notion.student_work_recent`
  - `desk_item: notion.unit_plan.title`
  - `npc_greeting: notion.morning_intention`
  - `bookshelf_top_row: goodreads.pedagogy_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "teach|lesson.*plan|grade|class" }`
  - `label_name_matches: /teaching|classroom|lessons|students/i`
  - `has_aspect: { aspect: "Goal", matches: "curriculum|certification|book" }`
  - `metric: { key: "calendar.teaching_hours_last_7d", op: ">", value: 15 }`
  - `label_name_matches: /grade\s?\d|\d(st|nd|rd|th)\s?grade/i`

---

### `office.pivot-table`

- **Sign name (canonical):** "The Pivot Table"
- **Sign name (LLM riff examples):** `"Harshith's Pivot Table"`, `"Two Joins Deep"`, `"Dashboard Hours"`
- **Profession / archetype:** data analyst / data scientist
- **Vibe (sensory):** dual-monitor, dashboard-blue, mug-of-the-team-logo. SQL on one screen, chart on the other.
- **Exterior sprite candidate(s):** `exteriors/office/condo-6.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-1.gif`
- **Palette accent hex:** `#5a7ad6` (dashboard cobalt)
- **Interior anchor objects (3-5):** dual monitors (SQL + chart), framed first-dashboard print, notebook of pivot scribbles, mug, post-its in clusters
- **NPC archetype:** Headphones on, eyes flicking between query and result, smiling small when a number lands.
- **NPC opening line examples (3):**
  - "I think the dashboard's lying. Help me prove it."
  - "Three joins deep. One more and I get an answer."
  - "What's the question, exactly? Phrase it like a SQL clause."
- **Slot bindings (3-5):**
  - `monitor_left: notion.recent_query.title`
  - `monitor_right: notion.recent_chart.thumbnail`
  - `framed_print: notion.first_dashboard.image`
  - `npc_greeting: notion.weekly_metric_review`
  - `pinboard: notion.metric_definitions`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "SQL|dashboard|analytics|metrics" }`
  - `label_name_matches: /analytics|data|metrics|dashboards/i`
  - `has_aspect: { aspect: "Goal", matches: "model|ML|attribution|forecast" }`
  - `has_integration: "looker"` or `"mode"` or `"metabase"`
  - `metric: { key: "github.notebooks_last_30d", op: ">", value: 5 }`

---

### `office.pitch-wall`

- **Sign name (canonical):** "The Pitch Wall"
- **Sign name (LLM riff examples):** `"Harshith's Pitch Wall"`, `"Launch Week"`, `"The Campaign Board"`
- **Profession / archetype:** marketer / growth
- **Vibe (sensory):** colorful, sticky-noted, slightly loud. Big board with creative variants pinned, mood-board collage, copy printed and circled.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-2.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-2.gif`
- **Palette accent hex:** `#e85a8a` (campaign magenta)
- **Interior anchor objects (3-5):** big pinboard of ad creatives, mood-board collage, copy-decked monitor, mug with brand logo, framed first-launch screenshot
- **NPC archetype:** Bright shirt, marker in hand, looking at the wall like it owes them an answer. Talks fast.
- **NPC opening line examples (3):**
  - "Which line lands harder? Don't think, react."
  - "Launch is Thursday. I have a draft of the post — read it?"
  - "Marketing's just writing. Sit down."
- **Slot bindings (3-5):**
  - `pinboard: figma.recent_ads_set` or `notion.campaign_assets`
  - `desk_item: notion.current_campaign.title`
  - `framed_print: notion.first_launch_post.image`
  - `npc_greeting: notion.campaign_kpi_today`
  - `wall_chart: notion.launch_calendar`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "campaign|growth|marketing|launch" }`
  - `label_name_matches: /marketing|growth|launch|campaign|copy/i`
  - `has_aspect: { aspect: "Goal", matches: "launch|attribution|signups|funnel" }`
  - `has_integration: "hubspot"` or `"mixpanel"` or `"linkedin"` (b2b lean)
  - `metric: { key: "notion.campaign_drafts_last_30d", op: ">=", value: 2 }`

---

### `office.the-headset-desk`

- **Sign name (canonical):** "The Headset Desk"
- **Sign name (LLM riff examples):** `"Harshith's Headset Desk"`, `"Queue's Light"`, `"Account Wall"`
- **Profession / archetype:** remote operator / customer support / sales / account exec
- **Vibe (sensory):** dual-monitor glow, slack-ping ambient, headset cushion squish. CRM ticket on one screen, Slack on the other, post-its for shortcuts edging the bezel.
- **Exterior sprite candidate(s):** `exteriors/office/condo-6.png`, `exteriors/office/office-example-1.png`
- **Interior sprite candidate(s):** `interiors/office/office-design-1.gif` (open floor, single station vibe)
- **Palette accent hex:** `#3a8ad6` (slack blue)
- **Interior anchor objects (3-5):** headset resting on the keyboard, takeaway coffee cup, dual monitor (CRM + Slack), post-its lining the monitor bezel, framed first-account-won card
- **NPC archetype:** Headset on, mug in hand, mid-call energy. Mutes to talk, unmutes mid-sentence.
- **NPC opening line examples (3):**
  - "On a call. Two minutes — I promise."
  - "Queue's down to three. Catch me now."
  - "Coffee's still hot. Pull up the spare chair."
- **Slot bindings (3-5):**
  - `monitor_left: salesforce.recent_opportunity.title` or `intercom.recent_conversation`
  - `monitor_right: slack.unread_summary`
  - `desk_item: notion.daily_pipeline_review`
  - `npc_greeting: zendesk.queue_status` or `notion.account_of_day`
  - `pinboard: notion.objection_handling_cheatsheet`
- **Trigger signals (3-5):**
  - `has_integration: "salesforce"` OR `has_integration: "intercom"` OR `has_integration: "zendesk"`
  - `label_name_matches: /support|sales|onboarding|account/i`
  - `has_aspect: { aspect: "Habit", matches: "calls|tickets|outbound|account review" }`
  - `has_aspect: { aspect: "Goal", matches: "quota|CSAT|NPS|renewals" }`
  - `metric: { key: "calendar.call_blocks_last_7d", op: ">", value: 10 }`

---

### `office.desk-by-the-window`

- **Sign name (canonical):** "Desk by the Window"
- **Sign name (LLM riff examples):** `"Harshith's Desk"`, `"Exam Week"`, `"Late Bell"`
- **Profession / archetype:** student / apprentice / learner-in-residence
- **Vibe (sensory):** daylight from the side, half-eaten food in arm's reach, textbook propped open. Single lamp, single plant, no overhead light.
- **Exterior sprite candidate(s):** `exteriors/home/terraced-house-1.png`, `exteriors/library/school-1.png`
- **Interior sprite candidate(s):** needs composition — small desk against a window, lamp, textbook stack
- **Palette accent hex:** `#d6c47a` (highlighter yellow)
- **Interior anchor objects (3-5):** textbook stack with bookmarks, laptop with stickers, half-eaten sandwich on a paper napkin, single houseplant in a clay pot, desk lamp angled low
- **NPC archetype:** Hoodie, pencil tucked behind ear, mid-problem-set. Looks up slowly, then welcomes you in.
- **NPC opening line examples (3):**
  - "I have this chapter and then I'm done. Stay if you want."
  - "Sandwich is communal. There's a half left."
  - "I'm stuck on problem nine. Read it with me?"
- **Slot bindings (3-5):**
  - `textbook_cover: goodreads.currently_studying`
  - `wall_calendar: notion.exam_calendar`
  - `desk_item: notion.problem_set.title`
  - `npc_greeting: notion.todays_topic`
  - `bookshelf_top_row: goodreads.coursework_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Goal", matches: "graduate|certif|exam|bootcamp|learn" }`
  - `label_name_matches: /school|class|study|homework|course/i`
  - `has_aspect: { aspect: "Habit", matches: "study|review|problem set|flash card" }`
  - `metric: { key: "calendar.study_blocks_last_7d", op: ">=", value: 5 }`
  - `has_integration: "duolingo"` or `"coursera"` or `"khan academy"` (if available)

---

## PRACTICE plot variants

4 variants. Licensed professional services — chambers, clinic, consulting-room, and the nurses' station. Split out of OFFICE in the catalog restructure so the desk-shaped knowledge-work plots (OFFICE) stay distinct from the credentialed practice plots (PRACTICE).

---

### `practice.chambers`

- **Sign name (canonical):** "Chambers"
- **Sign name (LLM riff examples):** `"Harshith's Chambers"`, `"The Reading Brief"`, `"Bench Notes"`
- **Profession / archetype:** lawyer
- **Vibe (sensory):** dark wood, leather-bound, careful. Heavy desk, ranks of casebooks, single green-glass banker's lamp.
- **Exterior sprite candidate(s):** `exteriors/library/clock-tower-1.png` or `exteriors/office/office-example-1.png`
- **Interior sprite candidate(s):** needs composition — wood-paneled book-walled office
- **Palette accent hex:** `#2e3a2a` (forest green leather)
- **Interior anchor objects (3-5):** heavy oak desk, leather chair, wall of casebooks, banker's lamp, file boxes stacked
- **NPC archetype:** Crisp shirt, sleeves up, half-moon glasses on a chain. Listens to the whole sentence before responding.
- **NPC opening line examples (3):**
  - "Sit. I've got fifteen minutes between filings."
  - "I want to read the contract you're worried about. All of it."
  - "Precedent's a comfort, but it's not an answer."
- **Slot bindings (3-5):**
  - `bookshelf_top_row: notion.casebook_list`
  - `desk_item: notion.active_matter.title`
  - `npc_greeting: calendar.next_hearing`
  - `wall_frame: notion.bar_admission_state`
  - `pinboard: linear.brief_drafts`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "drafting briefs|legal|contract" }`
  - `label_name_matches: /law|legal|contracts|matters/i`
  - `has_aspect: { aspect: "Goal", matches: "bar|partner|trial" }`
  - `has_integration: "clio"` (if extant)
  - `metric: { key: "calendar.hearings_last_30d", op: ">=", value: 1 }`

---

### `practice.consulting-room`

- **Sign name (canonical):** "The Consulting Room"
- **Sign name (LLM riff examples):** `"Harshith's Consulting Room"`, `"The Hour"`, `"Held Space"`
- **Profession / archetype:** therapist / coach / counselor
- **Vibe (sensory):** soft daylight through frosted glass, two armchairs angled toward each other, a tissue box at hand. Carpet absorbing sound, the kettle warm but quiet.
- **Exterior sprite candidate(s):** `exteriors/office/condo-example.png`, `exteriors/office/hospital-1.png` retinted as a clinic-of-one
- **Interior sprite candidate(s):** needs composition — two armchairs + side table + frosted window
- **Palette accent hex:** `#7a8a6a` (sage moss)
- **Interior anchor objects (3-5):** two facing armchairs, side table with tissues + water carafe, frosted window with soft daylight, hard-cover notebook on a low table, single floor plant
- **NPC archetype:** Cardigan over a soft shirt, hands folded, attentive without urgency. Lets the silence sit.
- **NPC opening line examples (3):**
  - "Take whichever chair feels right. We have the hour."
  - "We left off mid-sentence last time. Want to pick it up?"
  - "There's water on the table. Help yourself."
- **Slot bindings (3-5):**
  - `desk_item: notion.client_session_notes.today`
  - `wall_print: notion.framework_diagram`
  - `bookshelf_top_row: goodreads.therapy_shelf`
  - `npc_greeting: notion.intention_for_session`
  - `framed_print: notion.first_completed_engagement`
- **Trigger signals (3-5):**
  - `label_name_matches: /therapy|coaching|client/i` AND `has_aspect: { aspect: "Habit", matches: "session|client meeting|hold space" }`
  - `has_aspect: { aspect: "Goal", matches: "licensure|practice|caseload" }`
  - `has_integration: "calendly"` with high 1:1 booking rate
  - `metric: { key: "calendar.one_on_one_hours_last_7d", op: ">", value: 15 }`
  - `has_aspect: { aspect: "Preference", matches: "depth|presence|listening" }`

---

### `practice.the-clinic`

- **Sign name (canonical):** "The Clinic"
- **Sign name (LLM riff examples):** `"Harshith's Clinic"`, `"Morning Rounds"`, `"The Exam Room"`
- **Profession / archetype:** doctor / clinician
- **Vibe (sensory):** clean, fluorescent, careful. White walls, blue trim, stethoscope on a hook, paper roll on the bed.
- **Exterior sprite candidate(s):** `exteriors/office/hospital-1.png`
- **Interior sprite candidate(s):** needs composition — small exam room with desk + bed
- **Palette accent hex:** `#7ac4d6` (clinical cyan)
- **Interior anchor objects (3-5):** exam bed with paper roll, swivel desk with chart screen, sharps box, blood pressure cuff on a hook, framed med-school diploma
- **NPC archetype:** Scrubs or white coat, slightly tired, eyes that focus quickly. Speaks plainly.
- **NPC opening line examples (3):**
  - "I've got eleven minutes. What's going on?"
  - "Rounds at seven. Coffee on the cart in the hall."
  - "Sit on the bed if it's easier to talk."
- **Slot bindings (3-5):**
  - `wall_diploma: notion.credentials.recent`
  - `desk_screen: calendar.next_patient_slot`
  - `npc_greeting: notion.morning_briefing`
  - `pinboard: notion.continuing_ed`
  - `framed_photo: notion.team_picture`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "clinic|patient|practice medicine|rounds" }`
  - `label_name_matches: /medicine|clinic|patients|residency/i`
  - `has_aspect: { aspect: "Goal", matches: "fellowship|board|residency|practice" }`
  - `has_integration: "epic"` or `"athena"` (if available)
  - `metric: { key: "calendar.patient_slots_last_7d", op: ">", value: 30 }`

---

### `practice.nurses-station`

- **Sign name (canonical):** "The Nurses' Station"
- **Sign name (LLM riff examples):** `"Harshith's Station"`, `"Shift Change"`, `"Round Two"`
- **Profession / archetype:** nurse / caregiver / healthcare worker (not the attending physician)
- **Vibe (sensory):** fluorescent calm, sneaker squeak, hand-sanitizer sting. Scrub-colored cart pulled tight against the wall, clipboard always within reach.
- **Exterior sprite candidate(s):** `exteriors/office/hospital-1.png`
- **Interior sprite candidate(s):** needs composition — small workstation alcove with storage cart + clipboard
- **Palette accent hex:** `#5ad6b8` (scrub teal)
- **Interior anchor objects (3-5):** scrub-color storage cart, clipboard on a hook, hand-sanitizer pump, sneakers stowed under a chair, badge on a lanyard
- **NPC archetype:** Scrubs, hair tied back, badge on a retractable clip. Moves with practiced economy. Smiles between tasks.
- **NPC opening line examples (3):**
  - "I have a beat. What's going on?"
  - "Round's in twenty. Walk with me if you want."
  - "Sit on the stool. Off your feet for a minute."
- **Slot bindings (3-5):**
  - `clipboard: notion.patient_assignment_today`
  - `cart_label: notion.unit_inventory`
  - `wall_chart: notion.shift_schedule`
  - `npc_greeting: notion.handoff_note`
  - `framed_print: notion.first_unit_team_photo`
- **Trigger signals (3-5):**
  - `label_name_matches: /nursing|care|patient|shift/i` AND `has_aspect: { aspect: "Habit", matches: "shift|round|patient|caregiv" }`
  - `has_aspect: { aspect: "Goal", matches: "RN|BSN|certification|charge nurse" }`
  - `metric: { key: "calendar.shift_hours_last_7d", op: ">", value: 30 }`
  - `has_aspect: { aspect: "Belief", matches: "care|compassion|service" }`
  - `label_name_matches: /home health|hospice|caregiver/i`

---

## WORKSHOP plot variants

4 variants. Hands-on craft and floor work — the line (chef), the wet bench (scientist), the server closet (sysadmin/SRE), the drawing board (architect). Split out of OFFICE: the worker stands, the room hums, the tools are physical.

---

### `workshop.the-line`

- **Sign name (canonical):** "The Line"
- **Sign name (LLM riff examples):** `"Harshith's Line"`, `"Service at Six"`, `"The Pass"`
- **Profession / archetype:** chef / kitchen lead
- **Vibe (sensory):** stainless steel, gas-flame blue, heat. Knife magnets, mise-en-place trays, white towel over the shoulder.
- **Exterior sprite candidate(s):** `exteriors/cafe/market-small-2.png` (small kiosk / cafe-cart) or `exteriors/store/market-big-2.png`
- **Interior sprite candidate(s):** needs composition — narrow stainless line with prep + pass
- **Palette accent hex:** `#d04a2a` (flame orange)
- **Interior anchor objects (3-5):** stainless prep table, knife magnet strip, walk-in door, pass with ticket rail, chef's whites on a hook
- **NPC archetype:** Whites half-buttoned, white towel on shoulder, knife in hand mid-task. Doesn't pause unless they have to.
- **NPC opening line examples (3):**
  - "Two minutes. I have to plate this first."
  - "Taste this — tell me what's missing."
  - "Service at six. Talk fast or grab an apron."
- **Slot bindings (3-5):**
  - `pinboard: notion.menu_drafts`
  - `desk_item: notion.tomorrow_prep_list`
  - `npc_greeting: instagram.recent_dish`
  - `framed_photo: notion.team_line_photo`
  - `bookshelf_top_row: goodreads.cookbook_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "cook|recipe.*test|kitchen|menu" }`
  - `label_name_matches: /cooking|restaurant|menu|kitchen|chef/i`
  - `has_aspect: { aspect: "Goal", matches: "open.*restaurant|pop.*up|menu" }`
  - `has_integration: "instagram"` with food-tag bias
  - `metric: { key: "instagram.food_posts_last_30d", op: ">", value: 6 }`

---

### `workshop.the-wet-bench`

- **Sign name (canonical):** "The Wet Bench"
- **Sign name (LLM riff examples):** `"Harshith's Wet Bench"`, `"Lane Three"`, `"The Cold Room"`
- **Profession / archetype:** wet-lab scientist / biologist / chemist
- **Vibe (sensory):** fluorescent, faint chemical smell, careful. Lab bench, microscope, beakers, fume hood at the back.
- **Exterior sprite candidate(s):** `exteriors/office/hospital-1.png` (civic medical block)
- **Interior sprite candidate(s):** needs composition — bench-and-hood lab
- **Palette accent hex:** `#9ab8d6` (cold-room blue)
- **Interior anchor objects (3-5):** lab bench with pipettes, microscope on a stand, labeled sample fridge, lab notebook, framed first-paper figure
- **NPC archetype:** Lab coat, safety glasses on forehead, slow careful hands. Speaks while watching the timer.
- **NPC opening line examples (3):**
  - "Don't lean on the bench. Plate's running."
  - "Replicate three's looking promising. Don't jinx it."
  - "Coffee's outside. No drinks past the door."
- **Slot bindings (3-5):**
  - `framed_figure: notion.recent_paper_figure` or `arxiv.recent`
  - `desk_item: notion.current_experiment.title`
  - `wall_chart: notion.lab_calendar`
  - `npc_greeting: zotero.recent_save`
  - `bookshelf_top_row: notion.protocol_index`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "lab|experiment|protocol|assay" }`
  - `label_name_matches: /biology|chemistry|lab|experiments|wet lab/i`
  - `has_aspect: { aspect: "Goal", matches: "paper|grant|fellowship|PhD" }`
  - `has_integration: "zotero"` AND lab-tag bias
  - `metric: { key: "notion.protocols_last_60d", op: ">=", value: 3 }`

---

### `workshop.the-server-closet`

- **Sign name (canonical):** "The Server Closet"
- **Sign name (LLM riff examples):** `"Harshith's Server Closet"`, `"On Call"`, `"The Rack Room"`
- **Profession / archetype:** sysadmin / SRE / devops
- **Vibe (sensory):** blinking LEDs, cold air, low fan-hum. Single screen showing graphs, pager on the desk, runbook binder open.
- **Exterior sprite candidate(s):** `exteriors/office/condo-8.png`
- **Interior sprite candidate(s):** needs composition — small room with rack + monitoring desk
- **Palette accent hex:** `#3a5a4a` (rack-LED green)
- **Interior anchor objects (3-5):** server rack with cable management, monitoring dashboards on the wall, pager or phone with red light, runbook binder, energy drink can
- **NPC archetype:** Quiet, alert, headphones half on. Watches graphs the way other people watch fish.
- **NPC opening line examples (3):**
  - "Latency's up six milliseconds. Probably nothing."
  - "On call till Tuesday. Talk over the fan."
  - "Runbook's there. Don't touch the red breaker."
- **Slot bindings (3-5):**
  - `wall_dashboard: datadog.recent_alerts` or `notion.runbook_index`
  - `desk_pager: notion.on_call_schedule`
  - `framed_print: notion.first_incident_postmortem`
  - `npc_greeting: github.recent_infra_commit`
  - `bookshelf_top_row: goodreads.sre_shelf`
- **Trigger signals (3-5):**
  - `has_integration: "datadog"` or `"pagerduty"`
  - `has_aspect: { aspect: "Habit", matches: "on call|incidents|infrastructure" }`
  - `label_name_matches: /devops|sre|infra|ops|on-call/i`
  - `has_aspect: { aspect: "Goal", matches: "uptime|reliability|migration" }`
  - `metric: { key: "pagerduty.incidents_last_30d", op: ">", value: 3 }`

---

### `workshop.the-drawing-board`

- **Sign name (canonical):** "The Drawing Board"
- **Sign name (LLM riff examples):** `"Harshith's Drawing Board"`, `"North Elevation"`, `"The Model Room"`
- **Profession / archetype:** architect
- **Vibe (sensory):** trace paper, basswood smell, careful light. Big drafting table, foam-core models in a corner, T-square on a hook.
- **Exterior sprite candidate(s):** `exteriors/office/office-example-1.png`
- **Interior sprite candidate(s):** needs composition — big-table room with models
- **Palette accent hex:** `#a89a7a` (basswood tan)
- **Interior anchor objects (3-5):** large drafting table, basswood site model on a stand, roll of trace paper, T-square on a hook, framed building plan
- **NPC archetype:** Crisp shirt with one sleeve rolled, pencil tucked into hair. Squints at plans like they're listening to them.
- **NPC opening line examples (3):**
  - "The site wants the building to be smaller. We'll talk it through."
  - "Trace paper on top. Don't be precious."
  - "Light's the only material I care about today."
- **Slot bindings (3-5):**
  - `wall_plan: notion.current_project.elevation`
  - `desk_item: notion.client_brief.title`
  - `framed_print: notion.first_built_project.photo`
  - `npc_greeting: instagram.recent_architecture_save`
  - `bookshelf_top_row: goodreads.architecture_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "draft.*plan|model|architect" }`
  - `label_name_matches: /architecture|drafting|plans|site/i`
  - `has_aspect: { aspect: "Goal", matches: "license|registered architect|built" }`
  - `has_integration: "instagram"` with arch-tag bias
  - `metric: { key: "notion.project_files_last_30d", op: ">", value: 4 }`

---

## 2. HOME plot variants

9 variants. HOME is the user's *living* space — lifestyle archetype, not profession.

---

### `home.modern-villa`

- **Sign name (canonical):** "South Light"
- **Sign name (LLM riff examples):** `"Harshith's Place"`, `"The Front Step"`, `"South-Facing Window"`
- **Profession / archetype:** warm-modern default — the "no strong signal yet" baseline
- **Vibe (sensory):** light, airy, lived-in. Big window, wood floor, plant in the corner, mug on the coffee table.
- **Exterior sprite candidate(s):** `exteriors/home/villa-1.png` through `villa-5.png`, `exteriors/home/modern-house.png`
- **Interior sprite candidate(s):** `interiors/home/generic-home-1.png`
- **Palette accent hex:** `#d6b87a` (warm linen)
- **Interior anchor objects (3-5):** sofa with throw, coffee table with one mug, bookshelf, single big plant, framed photo
- **NPC archetype:** Comfortable, slightly soft, slippers on. Glad you came.
- **NPC opening line examples (3):**
  - "Come in. Kettle's hot."
  - "Sit wherever. I'm just tidying up."
  - "Nothing fancy today. Glad you stopped by."
- **Slot bindings (3-5):**
  - `framed_photo: instagram.recent_personal`
  - `bookshelf_top_row: goodreads.currently_reading`
  - `coffee_table_book: goodreads.recent_finish`
  - `npc_greeting: notion.daily_intention`
  - `wall_calendar: calendar.this_week_overview`
- **Trigger signals (3-5):**
  - `op: "always"` (default fallback)
  - (low priority — picked when nothing else matches)
  - `signalStrength.HOME < 0.3`

---

### `home.cottage`

- **Sign name (canonical):** "The Cottage"
- **Sign name (LLM riff examples):** `"Harshith's Cottage"`, `"Kettle's On"`, `"The Garden Door"`
- **Profession / archetype:** cozy / homebody / domestic-craft
- **Vibe (sensory):** soft, quilt-stacked, herb-scented. Low ceiling implied, thick rug, jars on shelves.
- **Exterior sprite candidate(s):** `exteriors/home/country-house.png`, `exteriors/home/country-house-no-banisters.png`
- **Interior sprite candidate(s):** `interiors/home/generic-home-1.png` with cottage overlay
- **Palette accent hex:** `#a8d67a` (sage)
- **Interior anchor objects (3-5):** stone hearth or wood stove, quilt-draped chair, jars of dried herbs, knit blanket folded on sofa, well-loved rug
- **NPC archetype:** Cardigan, gentle hands, smell-of-bread energy. Talks at the speed of a kettle.
- **NPC opening line examples (3):**
  - "Stew's on. Stay a while."
  - "Mind the cat. She thinks the rug is hers."
  - "I was just sitting down. Join me."
- **Slot bindings (3-5):**
  - `mantel_frame: instagram.recent_personal`
  - `pantry_jars: notion.recipe_index`
  - `bookshelf_top_row: goodreads.currently_reading`
  - `npc_greeting: notion.gratitude_note`
  - `wall_calendar: notion.seasonal_calendar`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "cozy|slow|home|baking|garden" }`
  - `label_name_matches: /home|cooking|garden|baking|cozy/i`
  - `has_aspect: { aspect: "Habit", matches: "bake|knit|garden|tea" }`
  - `has_integration: "instagram"` with home-tag bias
  - `signalStrength.HOME > 0.5`

---

### `home.condo`

- **Sign name (canonical):** "Tenth Floor"
- **Sign name (LLM riff examples):** `"Harshith's Apartment"`, `"The Skyline Window"`, `"Tenth-Floor Light"`
- **Profession / archetype:** urban apartment dweller — view-from-the-tenth-floor
- **Vibe (sensory):** sleek, view-driven, compact. City skyline through the window, single statement chair, gallery wall.
- **Exterior sprite candidate(s):** `exteriors/office/condo-4-38.png`, `exteriors/office/condo-4-39.png` (tall residential tower)
- **Interior sprite candidate(s):** `interiors/condo/condominium-design-1.png`, `condominium-design-2.png`
- **Palette accent hex:** `#3a5a7a` (city blue-grey)
- **Interior anchor objects (3-5):** statement chair facing the window, modern kitchen island, gallery wall of small frames, single tall plant, espresso machine
- **NPC archetype:** Sharp casual, neat space, moves efficiently between kitchen and chair. Watches the city.
- **NPC opening line examples (3):**
  - "View's better than the wine. Have both."
  - "I just got back. Espresso?"
  - "Sit by the window. Everyone does."
- **Slot bindings (3-5):**
  - `window_view: calendar.next_event_location` or `notion.city_now`
  - `gallery_wall: instagram.recent_grid_3`
  - `bookshelf_top_row: goodreads.currently_reading`
  - `npc_greeting: notion.evening_routine`
  - `kitchen_chalkboard: notion.takeout_log`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "city|urban|apartment" }`
  - `label_name_matches: /city|nyc|sf|apartment|urban/i`
  - `has_aspect: { aspect: "Habit", matches: "espresso|gym|commute" }`
  - `signalStrength.WORK > 0.6` AND `signalStrength.HOME < 0.4`

---

### `home.quiet-house`

- **Sign name (canonical):** "The Quiet House"
- **Sign name (LLM riff examples):** `"Harshith's House"`, `"Tatami Hours"`, `"The Low Table"`
- **Profession / archetype:** minimalist / eastern-aesthetic / disciplined-space
- **Vibe (sensory):** tatami, paper screens, careful emptiness. Low table, single scroll on the wall, kettle on a low stove.
- **Exterior sprite candidate(s):** needs custom or `exteriors/home/villa-3.png` retinted; flag as composition gap
- **Interior sprite candidate(s):** `interiors/home/quiet-house-1.png` (catalog file pending rename from the tatami-room asset shipped under the legacy filename)
- **Palette accent hex:** `#8a7a5a` (washi paper)
- **Interior anchor objects (3-5):** low chabudai table, floor cushion, single hanging scroll, tea set on a tray, sliding paper screen
- **NPC archetype:** Calm, soft-spoken, kneels rather than sits. Notices everything; comments on little.
- **NPC opening line examples (3):**
  - "Tea? It's already steeping."
  - "Sit. The kettle decides when we start."
  - "The wind's loud today. I like it."
- **Slot bindings (3-5):**
  - `hanging_scroll: notion.weekly_intention`
  - `tea_tray: notion.morning_routine`
  - `low_shelf: goodreads.currently_reading`
  - `npc_greeting: notion.daily_haiku`
  - `wall_kanji: notion.word_of_week`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "tatami|low table|minimalist|quiet space" }`
  - `label_name_matches: /minimal|meditation practice|low table|tatami/i`
  - `has_aspect: { aspect: "Habit", matches: "meditation practice|seated meditation|morning sit|low-table" }`
  - `has_aspect: { aspect: "Goal", matches: "daily meditation|minimalist home|simplify" }`
  - `signalStrength.HOME > 0.4`

---

### `home.lighthouse`

- **Sign name (canonical):** "The Lighthouse"
- **Sign name (LLM riff examples):** `"Harshith's Lighthouse"`, `"The Watch"`, `"Far Beam"`
- **Profession / archetype:** loner / coastal / solo-creative-out-of-town
- **Vibe (sensory):** wind, salt, rotating light. Spiral steps implied, single brass instrument on a desk, log book.
- **Exterior sprite candidate(s):** `exteriors/home/lighthouse-base.png`, `exteriors/home/lighthouse-example.png`
- **Interior sprite candidate(s):** needs composition — circular room with desk + window
- **Palette accent hex:** `#d6c47a` (lamp-yellow)
- **Interior anchor objects (3-5):** brass barometer, log book open on the desk, single chair facing the window, oil lamp, framed map of the coast
- **NPC archetype:** Wool sweater, distant gaze, weathered hands. Speaks rarely, well.
- **NPC opening line examples (3):**
  - "Wind's picking up. Close the door."
  - "Light's on a timer. We've got hours."
  - "I keep the log. Sit if you'd like."
- **Slot bindings (3-5):**
  - `log_book: notion.daily_journal`
  - `framed_map: notion.travel_log`
  - `bookshelf_top_row: goodreads.recent_solo_reads`
  - `npc_greeting: notion.weather_or_mood`
  - `barometer: notion.weekly_check_in`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "solitude|coast|ocean|quiet|sea" }`
  - `label_name_matches: /solo|alone|writing|coast/i`
  - `has_aspect: { aspect: "Habit", matches: "journal|long walks|read at night" }`
  - `metric: { key: "calendar.solo_time_last_7d", op: ">", value: 30 }`

---

### `home.cabin`

- **Sign name (canonical):** "The Cabin"
- **Sign name (LLM riff examples):** `"Harshith's Cabin"`, `"Wood Smoke"`, `"The Porch"`
- **Profession / archetype:** woodsy / outdoorsy / hands-on
- **Vibe (sensory):** pine, wood smoke, flannel. Stone hearth, antlers (or not), axe by the door, mug carved from wood.
- **Exterior sprite candidate(s):** `exteriors/home/tree-house-1.png`, or `country-house.png` retinted
- **Interior sprite candidate(s):** needs composition — log walls with hearth
- **Palette accent hex:** `#6a4a2a` (rich pine)
- **Interior anchor objects (3-5):** stone hearth, wool blanket on a rocking chair, axe by the door, kettle hung over coals, framed map of trails
- **NPC archetype:** Flannel, beard or knit cap, calm hands. Builds the fire while you talk.
- **NPC opening line examples (3):**
  - "Fire's catching. Pull the rocker over."
  - "Bring boots next time. Trail's nice in fall."
  - "Coffee's on the stove. Black if you want it."
- **Slot bindings (3-5):**
  - `framed_map: strava.recent_route`
  - `mantel_photo: instagram.recent_outdoor`
  - `bookshelf_top_row: goodreads.outdoor_shelf`
  - `npc_greeting: strava.last_activity`
  - `axe_hook: notion.weekend_plan`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "outdoors|cabin|woods|forest|hike" }`
  - `label_name_matches: /outdoors|hike|trail|woods|cabin/i`
  - `has_integration: "strava"` with hiking/trail bias
  - `has_aspect: { aspect: "Habit", matches: "hike|fish|camp|chop" }`

---

### `home.victorian-house`

- **Sign name (canonical):** "The Old House"
- **Sign name (LLM riff examples):** `"Harshith's Old House"`, `"The Parlor"`, `"Heritage Place"`
- **Profession / archetype:** traditional / heritage / generational
- **Vibe (sensory):** floral wallpaper, dark wood trim, things-with-stories. Heavy curtains, parlor formality, grand piano implied.
- **Exterior sprite candidate(s):** `exteriors/home/victorian-house-1.png` through `victorian-house-7.png`
- **Interior sprite candidate(s):** needs composition — wallpapered parlor with mantel
- **Palette accent hex:** `#7a3a5a` (burgundy)
- **Interior anchor objects (3-5):** mantel with mismatched frames, upright piano or grandmother clock, doily-topped side table, floral armchair, lace curtains
- **NPC archetype:** Pressed shirt, polite, particular. Pours tea correctly. Remembers everything.
- **NPC opening line examples (3):**
  - "Mind the threshold. House settled in '34."
  - "Tea's in the proper cups today."
  - "Everything in here has a story. Most of them are true."
- **Slot bindings (3-5):**
  - `mantel_frames: instagram.family_photos`
  - `parlor_shelf: goodreads.classics_shelf`
  - `npc_greeting: notion.family_birthday_today`
  - `wall_clock: notion.heirloom_log`
  - `piano_score: notion.song_of_week`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "classic|heritage|tradition|family" }`
  - `label_name_matches: /family|heritage|tradition|antique/i`
  - `has_aspect: { aspect: "Habit", matches: "piano|read.*classics|family dinner" }`
  - `signalStrength.HOME > 0.6`

---

### `home.salvage-house`

- **Sign name (canonical):** "The Salvage House"
- **Sign name (LLM riff examples):** `"Harshith's Place"`, `"The Patchwork"`, `"After Hours"`
- **Profession / archetype:** chaotic / punk / scavenger / built-from-found-pieces
- **Vibe (sensory):** corrugated, fairy-light, defiant. Patchwork walls, fairy lights strung haphazardly, plants growing through cracks.
- **Exterior sprite candidate(s):** `exteriors/home/post-apocalyptic-house-1.png`, `post-apocalyptic-house-2.png`
- **Interior sprite candidate(s):** needs composition — eclectic salvage interior
- **Palette accent hex:** `#c44a3a` (rust orange)
- **Interior anchor objects (3-5):** salvaged-pallet table, fairy lights strung over a couch, plant growing out of a tin can, painted mural on a brick wall, repurposed amp as a side table
- **NPC archetype:** Layered clothing, paint-on-hands, easy smile. Treats everything as fixable.
- **NPC opening line examples (3):**
  - "Couch's a bit of a fight. You'll find a soft side."
  - "I made the table out of a door. Pretty proud."
  - "Power's back. Probably until midnight."
- **Slot bindings (3-5):**
  - `wall_mural: instagram.recent_personal`
  - `salvage_shelf: notion.found_objects_log`
  - `fairy_light_string: notion.mood_today`
  - `npc_greeting: spotify.now_playing`
  - `bookshelf_top_row: goodreads.zine_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "DIY|punk|salvage|maker|chaos" }`
  - `label_name_matches: /punk|diy|maker|salvage|zine/i`
  - `has_aspect: { aspect: "Habit", matches: "make.*things|repair|build" }`
  - `has_integration: "instagram"` with maker-tag bias

---

### `home.the-family-room`

- **Sign name (canonical):** "The Family Room"
- **Sign name (LLM riff examples):** `"Harshith's Family Room"`, `"School Run"`, `"After Pickup"`
- **Profession / archetype:** parent / family coordinator / household lead
- **Vibe (sensory):** warm clutter, crayon-scribbled, snack-strewn. Shoes piled by the door, a kid's backpack hanging on a hook, fridge-art covering the fridge front.
- **Exterior sprite candidate(s):** `exteriors/home/terraced-house-4.png`, `exteriors/home/terraced-house-5.png`, `exteriors/home/modern-house.png`
- **Interior sprite candidate(s):** `interiors/home/generic-home-1.png` (cozy variant) — needs family-coordinator overlay
- **Palette accent hex:** `#e8a85a` (school-bus warmth)
- **Interior anchor objects (3-5):** shoe pile by the door, kids' backpack on a hook, fridge front covered in crayon art, weekly calendar on the wall, basket of folded laundry on the sofa
- **NPC archetype:** Comfortable layers, snack in hand, half-listening to a timer. Welcomes you mid-stride.
- **NPC opening line examples (3):**
  - "Pickup's at three. Come in 'til then."
  - "Don't trip over the shoes. We are all hopeless at this."
  - "Snack drawer's the third one. Help yourself."
- **Slot bindings (3-5):**
  - `wall_calendar: calendar.this_week_family_overview`
  - `fridge_art: notion.kid_art_archive`
  - `desk_item: notion.weekly_meal_plan`
  - `npc_greeting: notion.morning_logistics_note`
  - `bookshelf_top_row: goodreads.parenting_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "school run|pickup|dropoff|kids|family" }`
  - `label_name_matches: /family|kids|school|pickup/i`
  - `has_aspect: { aspect: "Goal", matches: "family time|kids|household|partner" }`
  - `metric: { key: "calendar.family_events_last_7d", op: ">=", value: 3 }`
  - `signalStrength.HOME > 0.5`

---

## 3. LIBRARY plot variants

6 variants. The reading / learning / thinking room.

---

### `library.the-reading-nook`

- **Sign name (canonical):** "The Reading Nook"
- **Sign name (LLM riff examples):** `"Harshith's Reading Chair"`, `"The Window Seat"`, `"Quiet Hours"`
- **Profession / archetype:** general reader / default fallback
- **Vibe (sensory):** soft, lamplit, paperback-warm. Single armchair, side table with a stack, window light.
- **Exterior sprite candidate(s):** `exteriors/library/hardware-store-example.png` (civic-storefront, cozy)
- **Interior sprite candidate(s):** `interiors/library/museum-room-4.png` (small room) — needs nook composition
- **Palette accent hex:** `#a87a5a` (book-cover tan)
- **Interior anchor objects (3-5):** armchair with throw, side table with stack of paperbacks, floor lamp, small bookshelf, mug
- **NPC archetype:** Cardigan, finger holding a page, friendly. Looks up slowly.
- **NPC opening line examples (3):**
  - "I'm at a good part. Sit, give me a paragraph."
  - "Take anything off the shelf. Bring it back."
  - "Slow afternoon. Good for it."
- **Slot bindings (3-5):**
  - `armchair_book: goodreads.currently_reading`
  - `side_table_stack: goodreads.up_next_3`
  - `wall_quote: notion.favorite_passage`
  - `npc_greeting: goodreads.recent_finish.title`
  - `bookshelf_top_row: goodreads.recent_shelf`
- **Trigger signals (3-5):**
  - `op: "always"` (default fallback for READ)
  - `signalStrength.READ < 0.5`

---

### `library.the-study`

- **Sign name (canonical):** "The Study"
- **Sign name (LLM riff examples):** `"Harshith's Study"`, `"Reading Brief"`, `"Margin Notes"`
- **Profession / archetype:** academic / paneled-wood reader
- **Vibe (sensory):** dark wood, leather chair, single green-glass lamp. Annotation-heavy.
- **Exterior sprite candidate(s):** `exteriors/library/clock-tower-1.png`
- **Interior sprite candidate(s):** `interiors/library/museum-room-3.png` adapted to a single private room
- **Palette accent hex:** `#3a4a3a` (banker's-lamp green)
- **Interior anchor objects (3-5):** leather chair, oak desk, wall of academic books, banker's lamp, stack of journal articles
- **NPC archetype:** Tweed, half-moon glasses, slow speech. Quotes things from memory.
- **NPC opening line examples (3):**
  - "I've reread the same page three times. It's worth it."
  - "Sit. Tell me what you're chasing."
  - "Footnotes are where the actual book is."
- **Slot bindings (3-5):**
  - `desk_stack: zotero.recent_citations`
  - `wall_shelf: goodreads.academic_shelf`
  - `wall_diploma: notion.credentials`
  - `npc_greeting: arxiv.recent_save`
  - `framed_quote: notion.epigraph_of_month`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "academic reading|annotate|footnote" }`
  - `label_name_matches: /research|academia|thesis|papers/i`
  - `has_integration: "zotero"`
  - `signalStrength.READ > 0.7`

---

### `library.the-museum-room`

- **Sign name (canonical):** "The Gallery Room"
- **Sign name (LLM riff examples):** `"Harshith's Gallery"`, `"The Exhibit"`, `"Long Walls"`
- **Profession / archetype:** museum-style reader / curator-of-knowledge
- **Vibe (sensory):** polished floor, glass cases, hush. The reading room as exhibit.
- **Exterior sprite candidate(s):** `exteriors/library/school-1.png`
- **Interior sprite candidate(s):** `interiors/library/museum-room-1.png`, `museum-room-2.png` (reuses Museum_Designs as intended)
- **Palette accent hex:** `#7a8a9a` (museum-marble grey)
- **Interior anchor objects (3-5):** glass display cases, framed wall pieces, bench in the center, info-card placards, polished floor
- **NPC archetype:** Soft-spoken docent, hands behind back, walks slowly through the room.
- **NPC opening line examples (3):**
  - "Take the bench in the middle. The room reads better seated."
  - "This piece changed for me this year. I'll tell you why."
  - "We close at five. Plenty of time."
- **Slot bindings (3-5):**
  - `display_case_1: goodreads.favorite_book.cover`
  - `wall_piece_left: instagram.recent_personal_art`
  - `wall_piece_right: notion.long_form_essay`
  - `npc_greeting: notion.recent_curation_note`
  - `bench_card: notion.exhibit_of_the_month`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "museum|curat|exhibit|collect" }`
  - `label_name_matches: /curation|museum|collection|gallery/i`
  - `has_aspect: { aspect: "Habit", matches: "visit museum|collect|catalog" }`
  - `signalStrength.READ > 0.5` AND `signalStrength.CREATE > 0.3`

---

### `library.the-tea-room`

- **Sign name (canonical):** "The Tea Room"
- **Sign name (LLM riff examples):** `"Harshith's Tea Room"`, `"Slow Reading"`, `"The Mat"`
- **Profession / archetype:** matches `home.quiet-house` — minimalist reading
- **Vibe (sensory):** tatami, low light, single book on the low table. Tea steeping.
- **Exterior sprite candidate(s):** `exteriors/library/hardware-store-example.png` retinted, or composition gap
- **Interior sprite candidate(s):** needs composition — reuse Japanese home interior framing
- **Palette accent hex:** `#7a8a5a` (matcha)
- **Interior anchor objects (3-5):** low table with single open book, floor cushion, tea kettle on a tray, single scroll, sliding screen
- **NPC archetype:** Quiet, slow gestures, kneels and reads. Welcoming without ceremony.
- **NPC opening line examples (3):**
  - "Tea's hot. Read with me."
  - "One book today. That's enough."
  - "Sit. The page can wait."
- **Slot bindings (3-5):**
  - `low_table_book: goodreads.currently_reading`
  - `hanging_scroll: notion.epigraph_of_week`
  - `tea_tray: notion.tea_log`
  - `npc_greeting: goodreads.recent_finish.title`
  - `floor_shelf: goodreads.eastern_shelf`
- **Trigger signals (3-5):**
  - `picked_variant.home == "home.quiet-house"` (variant correlation)
  - `has_aspect: { aspect: "Preference", matches: "tea|slow read|zen|minimal" }`
  - `label_name_matches: /tea|zen|slow reading/i`
  - `has_aspect: { aspect: "Habit", matches: "morning pages|slow read|tea" }`

---

### `library.the-archive`

- **Sign name (canonical):** "The Archive"
- **Sign name (LLM riff examples):** `"Harshith's Archive"`, `"The Stacks"`, `"Box 47"`
- **Profession / archetype:** dusty-basement reader — collector, historian, deep-cuts
- **Vibe (sensory):** dim, box-stacked, paper-smelling. Sliding ladder, manila folders, bare bulb.
- **Exterior sprite candidate(s):** `exteriors/library/generic-building-condo-6.png`
- **Interior sprite candidate(s):** needs composition — narrow stacks + single desk
- **Palette accent hex:** `#5a4a3a` (archive-box brown)
- **Interior anchor objects (3-5):** floor-to-ceiling boxes, sliding ladder, single desk under a bare bulb, label maker, magnifying glass on a chain
- **NPC archetype:** Cardigan over a tee, dust on the cuffs, alert eyes. Knows where everything is by smell.
- **NPC opening line examples (3):**
  - "Box 47, third shelf. We'll come back for it."
  - "Don't apologize for the dust. It's part of the work."
  - "Bulb's flickering. Read fast."
- **Slot bindings (3-5):**
  - `box_label_strip: notion.archive_index`
  - `desk_open_folder: notion.research_thread`
  - `wall_print: notion.recent_discovery`
  - `npc_greeting: notion.archive_log`
  - `bookshelf_bottom_row: goodreads.deep_cuts`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "archive|catalog|collect|historical" }`
  - `label_name_matches: /archive|history|collection|catalog/i`
  - `has_aspect: { aspect: "Goal", matches: "book.*history|research project|document" }`
  - `signalStrength.READ > 0.6`

---

### `library.the-corner-bookshop`

- **Sign name (canonical):** "The Corner Bookshop"
- **Sign name (LLM riff examples):** `"Harshith's Bookshop"`, `"Sunday Sale"`, `"Front Window"`
- **Profession / archetype:** commercial-feeling, browse-and-buy, social-reader
- **Vibe (sensory):** bell over the door, table of new releases, slightly cluttered. Cat on the counter optional.
- **Exterior sprite candidate(s):** `exteriors/library/hardware-store-example.png` (civic-storefront)
- **Interior sprite candidate(s):** needs composition — front-table + tall shelves
- **Palette accent hex:** `#c47a4a` (warm storefront)
- **Interior anchor objects (3-5):** front display table of new releases, cash counter, tall shelves down the side, bell over the door, framed staff-pick card
- **NPC archetype:** Apron over t-shirt, opinionated, warm. Re-shelves while talking.
- **NPC opening line examples (3):**
  - "New table's by the window. Pick one up."
  - "Staff-pick this week's a weird one. You'll like it."
  - "Coffee next door. Come back when you're ready."
- **Slot bindings (3-5):**
  - `front_table: goodreads.recent_acquisitions`
  - `staff_pick_card: goodreads.book_of_month`
  - `wall_shelf: goodreads.recommendations_received`
  - `npc_greeting: goodreads.recent_finish.title`
  - `bell_register: notion.book_journal`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "bookshop|browse|new releases|gift books" }`
  - `label_name_matches: /bookstore|bookshop|new releases|gifts/i`
  - `has_aspect: { aspect: "Habit", matches: "browse|recommend.*books|gift books" }`
  - `signalStrength.READ > 0.4` AND `signalStrength.MARKET > 0.3`

---

## 4. STORE plot variants

6 variants. The shopping / market / curation room.

---

### `store.the-corner-store`

- **Sign name (canonical):** "The Corner Store"
- **Sign name (LLM riff examples):** `"Harshith's Corner Stop"`, `"The Side Door"`, `"Pantry Stop"`
- **Profession / archetype:** default neighborhood shopper
- **Vibe (sensory):** small, familiar, packed shelves. Bell-on-the-door, gum at the counter, sodas in the back.
- **Exterior sprite candidate(s):** `exteriors/store/market-small-1.png`, `market-small-11.png`
- **Interior sprite candidate(s):** needs composition — small shelved store
- **Palette accent hex:** `#d6b87a` (warm shop-light)
- **Interior anchor objects (3-5):** packed wall shelves, counter with register, soda cooler, gum/mint rack, single tall plant by the window
- **NPC archetype:** Apron, pen behind ear, knows your face after one visit. Calm.
- **NPC opening line examples (3):**
  - "Usual? Or are we trying something today?"
  - "New brand of crackers came in. Worth a look."
  - "Take your time. I'm closing up at seven."
- **Slot bindings (3-5):**
  - `register_screen: amazon.recent_orders.count_this_month`
  - `wall_shelf: amazon.recent_household_items`
  - `framed_print: notion.first_recipe_made`
  - `npc_greeting: amazon.recent_delivery.title`
  - `chalkboard: notion.grocery_list`
- **Trigger signals (3-5):**
  - `op: "always"` (default fallback for MARKET)
  - `signalStrength.MARKET < 0.4`

---

### `store.the-mall`

- **Sign name (canonical):** "The Atrium"
- **Sign name (LLM riff examples):** `"Harshith's Atrium"`, `"The Floor"`, `"Saturday Browse"`
- **Profession / archetype:** big-box / multi-store shopper / online-heavy buyer
- **Vibe (sensory):** big, glossy, fountain-in-the-middle. Multiple storefronts implied, escalator hum.
- **Exterior sprite candidate(s):** `exteriors/store/mall-1.png`
- **Interior sprite candidate(s):** needs composition — atrium with multiple kiosks
- **Palette accent hex:** `#5ad6c4` (mall-tile teal)
- **Interior anchor objects (3-5):** central fountain or planter, glossy floor, multiple storefront facades, food-court directory, escalator
- **NPC archetype:** Headset, lanyard, professionally friendly. Knows the floor by heart.
- **NPC opening line examples (3):**
  - "Map's by the elevator. Anything specific?"
  - "Atrium's quiet today. Nice to walk."
  - "Sales board's around the corner."
- **Slot bindings (3-5):**
  - `directory_board: amazon.recent_categories`
  - `atrium_print: instagram.recent_haul`
  - `kiosk_1: amazon.recent_order.title`
  - `kiosk_2: amazon.wishlist.top_3`
  - `npc_greeting: amazon.recent_delivery_count`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "shop online|amazon|haul|browse" }`
  - `label_name_matches: /shopping|wishlist|online orders/i`
  - `has_integration: "amazon"` (if available) with high order count
  - `metric: { key: "amazon.orders_last_30d", op: ">", value: 8 }`

---

### `store.the-parlor`

- **Sign name (canonical):** "The Ice Cream Parlor"
- **Sign name (LLM riff examples):** `"Harshith's Parlor"`, `"Three Scoops"`, `"Sundae Window"`
- **Profession / archetype:** whimsical / treat-buyer / weekend-indulgent
- **Vibe (sensory):** pastel, sweet, child-of-a-summer-afternoon. Glass case of flavors, jingle bell at the door.
- **Exterior sprite candidate(s):** `exteriors/store/market-small-3.png` (open-air market stall) or `market-small-9.png`
- **Interior sprite candidate(s):** `interiors/store/ice-cream-shop.png` (reuses Ice_Cream_Shop_Designs)
- **Palette accent hex:** `#f8b8c4` (cotton-candy pink)
- **Interior anchor objects (3-5):** glass case of ice-cream tubs, pastel-tiled counter, soda fountain, small round tables, jukebox or radio
- **NPC archetype:** Striped apron, scoop in hand, perpetually a little sticky. Cheerful.
- **NPC opening line examples (3):**
  - "Three scoops or two? No wrong answer."
  - "New flavor today. It's weird. You'll like it."
  - "Sundae for the road?"
- **Slot bindings (3-5):**
  - `flavor_board: notion.treat_log`
  - `framed_print: instagram.dessert_posts`
  - `npc_greeting: notion.weekend_plan`
  - `jukebox: spotify.summer_playlist.name`
  - `wall_shelf: notion.dessert_book_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "sweet|dessert|treat|whimsical" }`
  - `label_name_matches: /dessert|treats|baking|whimsy/i`
  - `has_integration: "instagram"` with dessert-tag bias
  - `signalStrength.MARKET > 0.3`

---

### `store.the-outfitter`

- **Sign name (canonical):** "The Outfitter"
- **Sign name (LLM riff examples):** `"Harshith's Outfitter"`, `"The Fitting Room"`, `"Sunday Edit"`
- **Profession / archetype:** clothing / fashion / curated-style shopper
- **Vibe (sensory):** racks, soft music, focused mirror. Wood floor, brass rails, single statement mannequin.
- **Exterior sprite candidate(s):** `exteriors/store/market-big-4.png`
- **Interior sprite candidate(s):** needs composition (clothing store interior theme — Clothing_Store) — flag as composition gap
- **Palette accent hex:** `#8a5a3a` (leather brown)
- **Interior anchor objects (3-5):** brass clothing rail, full-length mirror, mannequin in the center, folded-stack shelf, single chair for waiting
- **NPC archetype:** Calm, well-dressed, attentive without hovering. Suggests one thing, not five.
- **NPC opening line examples (3):**
  - "Mirror's by the window. Better light."
  - "Try the dark one first. See how it sits."
  - "I just got a small shipment in. Tell me what fits."
- **Slot bindings (3-5):**
  - `mannequin_outfit: instagram.fashion_recent`
  - `wall_lookbook: notion.style_board`
  - `front_rail: amazon.fashion_recent_orders`
  - `npc_greeting: notion.recent_outfit_log`
  - `mirror_quote: notion.style_principle`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "style|fashion|outfit|curat.*wardrobe" }`
  - `label_name_matches: /fashion|style|outfits|wardrobe/i`
  - `has_integration: "instagram"` with fashion-tag bias
  - `metric: { key: "amazon.fashion_orders_last_60d", op: ">", value: 3 }`

---

### `store.the-saturday-market`

- **Sign name (canonical):** "Saturday Market"
- **Sign name (LLM riff examples):** `"Harshith's Saturday Stall"`, `"The Stall"`, `"Farm Table"`
- **Profession / archetype:** farmer-market / craft-fair / local-curator
- **Vibe (sensory):** open-air, hand-painted signs, mixed-stalls. Striped awning, cash box, jars of jam.
- **Exterior sprite candidate(s):** `exteriors/store/market-small-3.png`, `market-small-6.png`, `market-small-9.png`
- **Interior sprite candidate(s):** needs composition — open stall layout
- **Palette accent hex:** `#e8a85a` (canvas awning)
- **Interior anchor objects (3-5):** striped awning, wood plank table, mason jars of preserves, hand-painted price signs, small cash box
- **NPC archetype:** Sun-tanned, friendly, knows every stall by name. Trades samples.
- **NPC opening line examples (3):**
  - "Try the jam. The strawberry's the surprise."
  - "Stall closes at noon. Worth coming back for."
  - "Bring a tote next time."
- **Slot bindings (3-5):**
  - `chalkboard_specials: notion.farmers_market_log`
  - `wall_print: instagram.local_food_recent`
  - `jar_shelf: notion.preserves_inventory`
  - `npc_greeting: notion.weekly_haul`
  - `framed_quote: notion.season_in_food`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "farmers market|local|seasonal|preserv" }`
  - `label_name_matches: /local|farmers market|seasonal|csa/i`
  - `has_aspect: { aspect: "Preference", matches: "local|seasonal|small farm" }`
  - `signalStrength.MARKET > 0.3` AND `signalStrength.HOME > 0.4`

---

## STUDIO plot variants

5 variants. The performer / maker plot — where users *make* things audience-facing. Migrated from OFFICE in the restructure: atelier (artist), practice-room (musician), the-booth (podcaster), editing-bay (filmmaker), the-control-room (streamer). The OFFICE/STUDIO split is "work-for-employer" vs "work-for-audience".

---

### `studio.atelier`

- **Sign name (canonical):** "The Atelier"
- **Sign name (LLM riff examples):** `"Harshith's Atelier"`, `"The Painting Room"`, `"Underpainting"`
- **Profession / archetype:** artist / illustrator
- **Vibe (sensory):** turpentine, north-light, mess-as-process. Easel angled, jars of brushes in coffee tins, paint-smeared apron on a hook.
- **Exterior sprite candidate(s):** `exteriors/office/condo-8.png` (compact urban block) — reads as a small storefront-artist's-quarter
- **Interior sprite candidate(s):** needs composition — open floor with easels, drying rack
- **Palette accent hex:** `#b85a8a` (cadmium pink)
- **Interior anchor objects (3-5):** wooden easel, drying rack of canvases, jar of brushes, palette with crusted dabs, stool with paint on its legs
- **NPC archetype:** Apron, smudge of paint on their jaw they haven't noticed, looking at the work from across the room. Quiet, warm, intermittent.
- **NPC opening line examples (3):**
  - "Stand back here with me. Tell me what's wrong with it."
  - "Underpainting's the part nobody sees. It's mostly what makes it work."
  - "Paint's still wet. Don't lean."
- **Slot bindings (3-5):**
  - `easel_canvas: instagram.recent_post.image` or `behance.recent_work`
  - `wall_grid: behance.portfolio_thumbnails`
  - `npc_greeting: instagram.recent_caption`
  - `palette: <derived dominant colors from recent works>`
  - `desk_item: notion.commission_list`
- **Trigger signals (3-5):**
  - `has_integration: "behance"` or `has_integration: "instagram"` (with art-tag bias)
  - `has_aspect: { aspect: "Habit", matches: "paint|illustrat|draw" }`
  - `label_name_matches: /art|illustration|painting|commissions/i`
  - `has_aspect: { aspect: "Goal", matches: "exhibit|gallery|show" }`
  - `metric: { key: "instagram.art_posts_last_30d", op: ">", value: 4 }`

---

### `studio.practice-room`

- **Sign name (canonical):** "The Practice Room"
- **Sign name (LLM riff examples):** `"Harshith's Practice Room"`, `"Take Twelve"`, `"The Listening Booth"`
- **Profession / archetype:** musician / composer / producer
- **Vibe (sensory):** acoustic-treated, dim, cable-tangled. Cans of monitor speakers, mic stand mid-room, headphones over the chair back.
- **Exterior sprite candidate(s):** `exteriors/office/condo-9.png` (narrow urban tower)
- **Interior sprite candidate(s):** needs composition — small room with mixing desk + instrument
- **Palette accent hex:** `#4a3a6e` (deep velvet purple)
- **Interior anchor objects (3-5):** mixing desk with monitors, condenser mic on a boom, guitar or keyboard on a stand, acoustic panels on walls, lyric notebook on the desk
- **NPC archetype:** Headphones around neck, hand half-raised in the air conducting nothing. Listens before talking.
- **NPC opening line examples (3):**
  - "Headphones on. You need to hear what just happened on bar 32."
  - "I lost the take. It's fine. The next one will be better."
  - "Mind closing the door? The reverb's eating my snare."
- **Slot bindings (3-5):**
  - `monitor_screen: spotify.now_playing`
  - `pinboard: spotify.top_tracks_last_month`
  - `desk_item: ableton.current_project.name` (if integration exists; else notion doc)
  - `npc_greeting: spotify.recent_release_by_followed`
  - `wall_poster: spotify.top_artist.cover`
- **Trigger signals (3-5):**
  - `has_integration: "spotify"`
  - `has_aspect: { aspect: "Habit", matches: "produc|composing|writing music|practice.*guitar|piano" }`
  - `label_name_matches: /music|composition|production|songwriting/i`
  - `has_aspect: { aspect: "Goal", matches: "album|EP|release" }`
  - `metric: { key: "spotify.listening_hours_last_30d", op: ">", value: 80 }`

---

### `studio.the-booth`

- **Sign name (canonical):** "The Booth"
- **Sign name (LLM riff examples):** `"Harshith's Booth"`, `"On Air"`, `"Mic Check"`
- **Profession / archetype:** podcaster / broadcaster
- **Vibe (sensory):** foam-paneled, warm-dim, mic-front-and-center. Two mic arms, headphones doubled, "on air" sign unlit.
- **Exterior sprite candidate(s):** `exteriors/studio/condo-8.png`
- **Interior sprite candidate(s):** `interiors/studio/tv-studio.png` (close but TV-leaning, needs audio overlay)
- **Palette accent hex:** `#d6a83a` (warm amber)
- **Interior anchor objects (3-5):** boom mic with pop filter, headphone pair, mixer with VU lights, "on air" sign, framed first-episode artwork
- **NPC archetype:** Headphones around neck, comfortable in their voice. Smiles with their voice before their face.
- **NPC opening line examples (3):**
  - "We're recording. Whisper or wait — your call."
  - "I lost the cold open. Tell me what you'd want to hear first."
  - "Forty episodes in. Still nervous before tape rolls."
- **Slot bindings (3-5):**
  - `wall_poster: spotify.podcast.cover` or `notion.podcast_artwork`
  - `desk_item: notion.episode_outline.title`
  - `pinboard: notion.guest_list`
  - `npc_greeting: notion.recent_episode_title`
  - `framed_print: notion.first_episode_artwork`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "podcast|recording|interview" }`
  - `label_name_matches: /podcast|episodes|guests|recording/i`
  - `has_aspect: { aspect: "Goal", matches: "season|launch.*show|grow.*audience" }`
  - `has_integration: "riverside"` or `"descript"` (if available)
  - `metric: { key: "notion.episode_drafts_last_60d", op: ">=", value: 2 }`

---

### `studio.editing-bay`

- **Sign name (canonical):** "The Editing Bay"
- **Sign name (LLM riff examples):** `"Harshith's Editing Bay"`, `"Cuts and Conform"`, `"The Color Room"`
- **Profession / archetype:** filmmaker / video editor
- **Vibe (sensory):** dim, dual-monitor glow, color-calibrated. Wacom slab, headphones, timeline scrubbing audibly.
- **Exterior sprite candidate(s):** `exteriors/studio/condo-9.png` or `exteriors/office/condo-8.png`
- **Interior sprite candidate(s):** `interiors/studio/tv-studio.png` adjacent — needs composition for editing-only feel
- **Palette accent hex:** `#3a4a5a` (color-grade teal)
- **Interior anchor objects (3-5):** dual reference monitors, color-grading panel, shelf of hard drives, foam baffles, framed still from a past project
- **NPC archetype:** Dark hoodie, blue light on their face, headphones on. Pauses the timeline before turning to talk.
- **NPC opening line examples (3):**
  - "Rough cut's ugly. That's the point of a rough cut."
  - "Sorry — I'm watching this for the eightieth time. Tell me what you see."
  - "Sound's still off. Picture's locked. Almost."
- **Slot bindings (3-5):**
  - `monitor_left: youtube.recent_upload.thumbnail` or `vimeo.recent`
  - `monitor_right: youtube.current_project.title`
  - `framed_still: youtube.top_video.thumbnail`
  - `npc_greeting: youtube.recent_comment_summary`
  - `desk_item: notion.shot_list`
- **Trigger signals (3-5):**
  - `has_integration: "youtube"` or `has_integration: "vimeo"`
  - `has_aspect: { aspect: "Habit", matches: "editing|filmmaking|video" }`
  - `label_name_matches: /video|film|edit|cinema/i`
  - `has_aspect: { aspect: "Goal", matches: "documentary|short film|series" }`
  - `metric: { key: "youtube.uploads_last_90d", op: ">=", value: 1 }`

---

### `studio.the-control-room`

- **Sign name (canonical):** "The Control Room"
- **Sign name (LLM riff examples):** `"Harshith's Control Room"`, `"Live in Five"`, `"The Stream Desk"`
- **Profession / archetype:** creator / streamer / live broadcaster
- **Vibe (sensory):** ring-light glow, blue capture-LED, chat scrolling. Boom mic dipped from above, mechanical clack under the ring light, a constant low fan hum.
- **Exterior sprite candidate(s):** `exteriors/studio/condo-8.png`, `exteriors/studio/condo-9.png`
- **Interior sprite candidate(s):** needs composition — desk with ring light, capture card, chat overlay monitor
- **Palette accent hex:** `#8a3ad6` (twitch purple)
- **Interior anchor objects (3-5):** ring light on a boom, capture card with blue LED, microphone on a boom arm, multi-monitor with chat overlay window, energy drink can on the desk
- **NPC archetype:** Headphones around the neck, mic-arm always in reach, half-glance at chat while talking. Reads the room and the chat at the same time.
- **NPC opening line examples (3):**
  - "Hold on — chat's spinning out. Two seconds."
  - "We go live at the top of the hour. Talk before then."
  - "Mic's hot. Whisper or wait."
- **Slot bindings (3-5):**
  - `monitor_chat: twitch.recent_chat_summary` or `youtube.recent_live_chat`
  - `wall_poster: twitch.recent_clip.thumbnail` or `youtube.recent_thumbnail`
  - `desk_item: notion.stream_schedule.today`
  - `npc_greeting: twitch.last_stream_title`
  - `framed_print: notion.first_subscriber_note`
- **Trigger signals (3-5):**
  - (`has_integration: "twitch"` OR `has_integration: "youtube"`) AND `has_aspect: { aspect: "Habit", matches: "stream|record|publish video" }`
  - `label_name_matches: /stream|broadcast|live|vod/i`
  - `has_aspect: { aspect: "Goal", matches: "channel|subscribers|partner|affiliate" }`
  - `metric: { key: "twitch.streams_last_30d", op: ">=", value: 4 }`
  - `metric: { key: "youtube.uploads_last_30d", op: ">=", value: 2 }`

---

## STATION plot variants

3 variants. Stations / terminals / transit — activated when CORE sees commute, flight, or weekend-getaway signal.

---

### `station.the-platform`

- **Sign name (canonical):** "The Platform"
- **Sign name (LLM riff examples):** `"Harshith's Platform"`, `"The 7:42"`, `"Track Two"`
- **Profession / archetype:** commuter / regular train rider
- **Vibe (sensory):** platform light, distant rail clack, weekday hum. Coffee in one hand, phone in the other.
- **Exterior sprite candidate(s):** `exteriors/station/train-blue-1.png`, `exteriors/station/train-blue-2.png`
- **Interior sprite candidate(s):** `interiorStatus: "none in pack — needs composition or skipped"`
- **Palette accent hex:** `#5a7a9a` (platform steel)
- **Interior anchor objects (3-5):** ticket machine, timetable board, departures clock, wooden bench, vending machine
- **NPC archetype:** Commuter half-checked-out, phone in hand, eyes on the next departure.
- **NPC opening line examples (3):**
  - "Eight minutes 'til the next one. Sit if you want."
  - "Tap card's faster than the machine. Always."
  - "Late train. Predictable."
- **Slot bindings (3-5):**
  - `timetable_board: calendar.next_commute_event`
  - `npc_greeting: google_maps.recent_route`
  - `wall_print: notion.commute_log`
  - `desk_item: notion.morning_routine`
  - `vending_machine: notion.snack_log`
- **Trigger signals (3-5):**
  - `has_integration: "google_maps"` AND `has_aspect: { aspect: "Habit", matches: "commute|train|metro|subway" }`
  - `label_name_matches: /commute|train|metro|subway/i`
  - `metric: { key: "google_maps.commutes_last_30d", op: ">", value: 10 }`

---

### `station.the-departures-board`

- **Sign name (canonical):** "The Departures Board"
- **Sign name (LLM riff examples):** `"Harshith's Departures"`, `"Gate B12"`, `"Frequent Flyer"`
- **Profession / archetype:** frequent flyer / business traveler
- **Vibe (sensory):** busy urban hub, rolling luggage, flip-board click. Coffee kiosk steam, queue rope tension.
- **Exterior sprite candidate(s):** `exteriors/station/train-white-left.png`, `exteriors/station/train-white-middle.png`, `exteriors/station/train-white-right.png`
- **Interior sprite candidate(s):** `interiorStatus: "none in pack — needs composition or skipped"`
- **Palette accent hex:** `#3a4a6a` (terminal-board navy)
- **Interior anchor objects (3-5):** large flip-board display, luggage cart, coffee kiosk, queue rope, rolling bag
- **NPC archetype:** Business traveler with a rolling bag, jacket folded over one arm. Checks watch and board in the same glance.
- **NPC opening line examples (3):**
  - "Boards two and four are mine this week. Don't ask."
  - "Two-hour layover. Talk to me."
  - "I memorised the kiosk menu. I'm not proud."
- **Slot bindings (3-5):**
  - `flip_board: tripit.next_trip`
  - `npc_greeting: tripit.recent_itinerary`
  - `wall_print: instagram.recent_travel`
  - `kiosk_chalkboard: notion.coffee_log`
  - `desk_item: expensify.recent_report`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "flight|airport|trip|travel" }`
  - `has_integration: "tripit"` OR `has_integration: "expensify"`
  - `label_name_matches: /travel|airport|flight|business trip/i`
  - `metric: { key: "tripit.trips_last_90d", op: ">=", value: 3 }`

---

### `station.the-whistle-stop`

- **Sign name (canonical):** "The Whistle Stop"
- **Sign name (LLM riff examples):** `"Harshith's Whistle Stop"`, `"Last Train Friday"`, `"Coast Line"`
- **Profession / archetype:** weekender / slow traveler / small-town rider
- **Vibe (sensory):** small rural platform, single lamp, paper schedule pinned to the wall. The agent is also the stationmaster.
- **Exterior sprite candidate(s):** `exteriors/station/train-green-left.png`, `exteriors/station/train-green-right.png`, `exteriors/station/train-orange-left.png`, `exteriors/station/train-orange-middle.png`, `exteriors/station/train-orange-right.png`
- **Interior sprite candidate(s):** `interiorStatus: "none in pack — needs composition or skipped"`
- **Palette accent hex:** `#8a6a4a` (warm wood platform)
- **Interior anchor objects (3-5):** small wooden bench, paper schedule pinned to the wall, single lamp, stationmaster cap on a hook, tin sign
- **NPC archetype:** Friendly stationmaster, cap askew, knows everyone by name and route. Tells you about the platform's namesake.
- **NPC opening line examples (3):**
  - "Last one through was Tuesday's freight. Next one's Friday."
  - "Sit. The lamp's the only timer I've got."
  - "Cap's been on that hook longer than I've worked here."
- **Slot bindings (3-5):**
  - `wall_schedule: notion.weekend_plan`
  - `npc_greeting: notion.weekend_destination`
  - `cap_hook: notion.travel_journal`
  - `framed_print: instagram.recent_countryside`
  - `desk_item: notion.next_getaway`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Preference", matches: "small town|countryside|weekend trips|slow travel" }`
  - `label_name_matches: /weekend|getaway/i`
  - `has_aspect: { aspect: "Habit", matches: "weekend|day trip|countryside" }`

---

## 5. New plots emerging from role analysis

4 new plot candidates. Each maps to an existing or new Category, has asset support, and is activatable by a clean CORE signal.

---

### Plot: `gym`  →  Category: `MOVE`  →  District: `WELLNESS`

Activated by: `has_integration: "strava"` OR `has_integration: "whoop"` OR `has_aspect: { aspect: "Habit", matches: "lift|run|workout|train" }` OR `label_name_matches: /fitness|gym|training/i`.

---

### `gym.the-iron-room`

- **Sign name (canonical):** "The Iron Room"
- **Sign name (LLM riff examples):** `"Harshith's Iron Room"`, `"Five by Five"`, `"The Rack"`
- **Profession / archetype:** strength athlete / lifter
- **Vibe (sensory):** chalk dust, plate-on-plate clang, mirror wall. Single rack, bench, focus.
- **Exterior sprite candidate(s):** `exteriors/gym/basketball-court-6.png` (outdoor-court adjacent, will need a real gym exterior eventually)
- **Interior sprite candidate(s):** `interiors/gym/gym-1.png` (weight-training room)
- **Palette accent hex:** `#3a3a3a` (cast iron)
- **Interior anchor objects (3-5):** squat rack with loaded bar, mirror wall, chalk bucket, notebook with PR log, bench with towel
- **NPC archetype:** Tank top, callused hands, calm between sets. Talks in cues.
- **NPC opening line examples (3):**
  - "Squat day. Five by five. Spot me if you stay."
  - "Form first. Numbers come."
  - "Chalk's there. Wipe the bar down after."
- **Slot bindings (3-5):**
  - `pr_log: strava.recent_lift_prs` or `notion.lift_log`
  - `wall_chart: notion.training_block`
  - `mirror_print: notion.physique_milestone`
  - `npc_greeting: notion.today_session`
  - `bookshelf: goodreads.training_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "lift|squat|train|gym" }`
  - `label_name_matches: /lifting|strength|gym|powerlifting/i`
  - `has_integration: "strava"` with strength-bias
  - `metric: { key: "strava.strength_sessions_last_30d", op: ">", value: 8 }`

---

### `gym.the-long-run`

- **Sign name (canonical):** "The Long Run"
- **Sign name (LLM riff examples):** `"Harshith's Long Run"`, `"Mile Twelve"`, `"The Loop"`
- **Profession / archetype:** runner / endurance athlete
- **Vibe (sensory):** light, breezy, foam-rolled. Open floor, single treadmill, foam roller, map of routes on the wall.
- **Exterior sprite candidate(s):** `exteriors/gym/soccer-court-1.png` (outdoor pitch energy)
- **Interior sprite candidate(s):** `interiors/gym/gym-2.png` adapted; or composition
- **Palette accent hex:** `#5ad6e8` (cool sky)
- **Interior anchor objects (3-5):** treadmill, foam roller and bands, route map of the city, water bottle, framed bib from first race
- **NPC archetype:** Light layers, slight sheen of sweat, calm breath. Looks at the watch but doesn't fixate.
- **NPC opening line examples (3):**
  - "Twelve miles done. Walking it out."
  - "Map's by the door. Want company Sunday?"
  - "I lied about my pace. Keep it between us."
- **Slot bindings (3-5):**
  - `wall_map: strava.route_heatmap`
  - `bib_frame: strava.first_race_bib`
  - `weekly_chart: strava.mileage_last_4w`
  - `npc_greeting: strava.last_activity_summary`
  - `pinboard: notion.race_calendar`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "run|jog|long run" }`
  - `label_name_matches: /running|marathon|10k|half/i`
  - `has_integration: "strava"` with run-bias
  - `metric: { key: "strava.run_miles_last_30d", op: ">", value: 40 }`

---

### Plot: `cafe`  →  Category: `KITCHEN`  →  District: `MARKET`

Activated by: `has_aspect: { aspect: "Habit", matches: "coffee|cafe|pour over|espresso" }` OR `label_name_matches: /coffee|cafe|barista/i`.

---

### `cafe.the-counter`

- **Sign name (canonical):** "First Pour"
- **Sign name (LLM riff examples):** `"Harshith's First Pour"`, `"Bar Stop"`, `"Bean to Cup"`
- **Profession / archetype:** coffee-obsessed home barista / hospitality enthusiast
- **Vibe (sensory):** roast smell, milk-steaming hiss, brass-and-wood. Single espresso machine on a wood counter, grinder, scale.
- **Exterior sprite candidate(s):** `exteriors/cafe/market-small-2.png`, `market-small-5.png`, `market-small-7.png`
- **Interior sprite candidate(s):** _no native cafe interiors_ — needs composition (note the catalog gap)
- **Palette accent hex:** `#6a3a2a` (espresso brown)
- **Interior anchor objects (3-5):** espresso machine, conical burr grinder, scale + cups, jar of single-origin beans, framed first-latte-art
- **NPC archetype:** Apron, towel on shoulder, hands steady on the steam wand. Quietly proud.
- **NPC opening line examples (3):**
  - "New origin in. Want the cortado or just the espresso?"
  - "Grinder's dialed. Took me a week."
  - "Pour-over takes four minutes. Talk to me."
- **Slot bindings (3-5):**
  - `chalkboard_origins: notion.coffee_journal`
  - `wall_print: instagram.coffee_recent`
  - `bean_jar_label: notion.current_bean`
  - `npc_greeting: notion.cup_of_today`
  - `bookshelf: goodreads.coffee_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "espresso|pour over|coffee.*daily" }`
  - `label_name_matches: /coffee|barista|espresso/i`
  - `has_aspect: { aspect: "Preference", matches: "single origin|specialty coffee" }`
  - `has_integration: "instagram"` with coffee-tag bias

---

### Plot: `stage`  →  Category: `PERFORM`  →  District: `ARTS`

Activated by: live-music, comedy, theatre, dance. `has_aspect: { aspect: "Habit", matches: "perform|gig|stage|set" }` OR `label_name_matches: /gigs|sets|stage|theatre/i`.

---

### `stage.footlight-hall`

- **Sign name (canonical):** "Footlight Hall"
- **Sign name (LLM riff examples):** `"Harshith's Footlight Hall"`, `"Doors at Eight"`, `"The Green Room"`
- **Profession / archetype:** performer (musician with gigs, comedian, theatre actor, DJ)
- **Vibe (sensory):** red curtains, single spotlight, dim back-of-house. Stack of setlists on a stool, mic stand at the apron.
- **Exterior sprite candidate(s):** `exteriors/studio/condo-9.png` retinted; or composition from `exteriors/library/clock-tower-1.png` for a more theatre-civic feel
- **Interior sprite candidate(s):** `interiors/studio/tv-studio.png` adapted (set lights + cameras → stage lights)
- **Palette accent hex:** `#9a2a3a` (curtain red)
- **Interior anchor objects (3-5):** curtain backdrop, single spotlight cone on the floor, mic stand, setlist on a stool, framed first-gig poster
- **NPC archetype:** Sound-check casual, in-between confident. Looks past you to the back row.
- **NPC opening line examples (3):**
  - "Doors at eight. We have time."
  - "Setlist's open. Tell me which one to cut."
  - "Soundcheck went badly. The show'll be fine."
- **Slot bindings (3-5):**
  - `wall_poster: notion.gig_poster_recent`
  - `setlist_stool: notion.setlist_today`
  - `framed_print: notion.first_gig_poster`
  - `npc_greeting: notion.next_show_note`
  - `bookshelf: goodreads.performance_shelf`
- **Trigger signals (3-5):**
  - `has_aspect: { aspect: "Habit", matches: "gig|set|perform|standup|theatre" }`
  - `label_name_matches: /gigs|sets|stage|standup|theatre/i`
  - `has_aspect: { aspect: "Goal", matches: "tour|run.*show|album|special" }`
  - `has_integration: "spotify"` (artist) or `notion.show_calendar`
  - `metric: { key: "calendar.shows_last_60d", op: ">", value: 1 }`

---

## Naming convention rules

The implicit tone rules from `apps/web/src/lib/curator/prompt.ts`, made explicit for variant authors:

- **Concrete over abstract, always.** "The Drafting Table" beats "The Design Space." A real thing in a room beats the room itself.
- **Title Case is default.** No all-caps style. No all-lowercase except when it's clearly load-bearing (rare for canonical catalog names).
- **2-4 words is the sweet spot.** Single-word names are permitted when the word does heavy lifting ("Chambers", "Atelier"). Five+ words usually means you're padding.
- **Canonical catalog names should NOT be possessive.** The curator adds possessives per-user at render time. Aim for under 30% possessive entries across the whole catalog. (I have zero possessive canonicals in this draft on purpose; the LLM riff examples show how possessives get layered on.)
- **Banned word list (from curator prompt, codified):** no `Haven`, `Hub`, `Lab`, `Studio`, `Vault`, `Sanctuary`, `Nexus`, `HQ`, `Stack`, `Vibes`, `Factory`, generic `Den` (only the possessive `<Name>'s Hacker Den` style is earned). `Studio` and `Lab` are acceptable only when the variant ITSELF is a literal studio or wet lab — never as decorative suffix.

## Open taxonomic questions

Honest things to weigh in on before we commit to manifests:

1. **HOME = lifestyle or aesthetic?** Right now I've drawn HOME variants as *lifestyle* archetypes (cottage, lighthouse, cabin) with implied aesthetics, not pure aesthetics (warm-cottagecore, dark-academia, brutalist-minimal). The lifestyle framing makes triggers cleaner — we have habit/preference data, not "vibe" data — but it means an urban modern-aesthetic homebody falls into `home.modern-villa` when `home.condo` might be visually closer. Worth a call.
2. ✅ **Resolved — OFFICE overload.** Split OFFICE into three plots: OFFICE (knowledge work, desk-shaped), PRACTICE (licensed professional services — chambers, clinic, consulting, nurses' station), and WORKSHOP (hands-on craft — line, wet bench, server closet, drawing board). 26 → 13/4/4 distribution.
3. ✅ **Resolved — practice/stage/booth confusion.** All performer archetypes (atelier, practice-room, the-booth, editing-bay, the-control-room) migrated from OFFICE into STUDIO (CREATE). Stage variants live in their own STAGE plot under new PERFORM category. The needs-art STUDIO placeholder ("The Workshop") was dropped — it overlapped the new WORKSHOP plot semantically.
4. **Cross-cutting modifiers vs full variants.** "Night owl" vs "morning person" feels like a tag that should modify *any* variant (lighting, NPC posture) rather than spawn its own variant. Same for "introvert vs gregarious", "minimal vs maximal", "weekday-only vs weekend-heavy". Do we want a modifier tag system layered on top of variants, or do we just bake the most common combinations into named variants?
5. **`cafe` plot category.** Coffee is genuinely a distinct space for a lot of users — but is it big enough to warrant a top-level category (KITCHEN? CAFE? MARKET-adjacent?), or should it just be a STORE variant for coffee-buyers and a HOME variant for home-baristas? Currently I've drafted it as a new plot under a tentative `KITCHEN` category; if KITCHEN is overreach, fold this into `store.the-corner-store` for coffee-buyers and skip the home-barista version.
6. ✅ **Resolved — side-table.** Renamed to `office.two-by-two-table` / "The Two-by-Two Table" to lean on the consultant's actual artefact (the 2x2 on the whiteboard) instead of a generic piece of furniture.
7. ✅ **Resolved — the-house.** Renamed to `stage.footlight-hall` / "Footlight Hall." "The House" was too overloaded (theatre audience, music venue, residential) and triggered ambiguity against HOME variants.
8. ✅ **Resolved — patchwork.** `home.post-apocalyptic` renamed to `home.salvage-house` / "The Salvage House." Drops the apocalyptic framing in favor of the affirmative one — these users *make* things from found pieces, they aren't surviving an apocalypse.
9. ✅ **Resolved — quiet-house.** The former minimalist-tatami variant is now `home.quiet-house` / "The Quiet House." Pulled the zen, country-of-origin, and tea regex triggers and re-keyed on concrete preferences (tatami, low table, minimalist, meditation practice) so non-Japanese minimalists land here cleanly and people of Japanese heritage who don't live this way don't get force-routed in.
10. **Practice room split.** Should `studio.practice-room` split into instrumentalist vs producer (`studio.mixing-desk`)? A bedroom producer with no acoustic instrument reads visually differently from a guitarist with a single mic. Worth weighing once we see real Spotify-for-Artists data.
11. **Curator refusal threshold.** How aggressive should the curator be at refusing to name a variant when triggers are weak? Two failure modes: (a) over-confident naming on thin data ("The Hacker Cabin" for someone with 3 GitHub stars), (b) over-refusal that leaves users staring at default `home.modern-villa` forever. Need a clear "minimum signal" floor and a graceful default-with-hedge sign.


12. ✅ **Resolved — MUSEUM as a standalone plot.** Dropped — the museum interior assets (Museum_Designs) are reused inside `library.the-museum-room`, which keeps the museum vibe without crowding the category list.

## Trigger ambiguity flags

Cases where multiple variants could match and we'd need an LLM-judge tie-break:

1. **The designer-who-codes.** Both `office.hacker-cabin` and `office.drafting-table` will hit for someone with GitHub + Figma. Currently no rule decides who wins. Heuristic option: weight by recency of activity and by the user's *self-described* role in their first name + bio if we have it. LLM judge gets a "primary craft?" prompt.
2. **The PM-who-writes-specs.** `office.sticky-wall` and `office.writing-room` overlap heavily for product folks who write a lot. Probably resolves by integration mix (Linear + Notion = PM; Substack + Notion = writer), but a "writer-PM" exists and could flip-flop week to week.
3. **The founder-who-codes.** `office.whiteboard-room` (founder vibe) vs `office.hacker-cabin` (still pushing code). The founder vibe should generally win once team size > 1 or once Linear/Notion ramp up; the hacker cabin wins for solo founders. Need a clear rule.
4. **Home / library overlap.** A heavy reader who lives in `home.lighthouse` is also a heavy reader; do we still also show `library.the-archive` or does the lifestyle home plot eat the library plot's signal? Suggest: HOME always renders; LIBRARY only renders when READ signal is materially distinct from the user's home-domestic reading.
5. **The chef-with-a-podcast.** `workshop.the-line` (chef), `studio.the-booth` (podcaster), `cafe.the-counter` (coffee-obsessed), all valid. The catalog can't hold all three for one user without the town feeling like a costume rack. Rules-engine needs a "max plots-per-category-cluster" cap, and LLM judge picks the one that's MOST this person.

## Trigger quality + precedence rules

Codex's prescription for keeping the curator honest. These rules live above the per-variant triggers and constrain how matches are scored.

### Banned bare-regex tokens

A regex hit on any of these tokens, alone, is never enough to pick a variant. They MUST be paired with a corroborating signal (an aspect match, an integration weight above floor, or a second regex hit on a more specific token).

```
ship
build
model
PM
class
local
city
quiet
tea
market
```

Rationale: each of these words crosses too many roles. "ship" hits founders, engineers, and logistics. "model" hits ML, fashion, and architecture. "class" hits teachers, students, and rideshare-tier names. "tea" reads as a kitchen ingredient AND a personality. We never let a single hit decide a variant.

### Integrations are corroboration, not identity

Connected accounts tell us what tools a person *uses*. They do not tell us who that person *is*. Map the false positives explicitly:

- Spotify ≠ musician. Most Spotify users are listeners.
- Instagram ≠ artist. Most Instagram users post personal life.
- Notion ≠ writer. Most Notion users are PMs, students, founders, or list-makers.
- GitHub ≠ developer. Many GitHub accounts belong to designers, PMs, and writers who fork things.

Integration presence alone never wins against another variant whose triggers include an aspect match. Integration weight is a tiebreaker, not a primary signal.

### Self-description outranks volume

Volumetric proxies seduce. A heavy calendar week looks like a founder. Eighty Spotify hours looks like a composer. They aren't.

- Calendar meetings > 20 ≠ founder. Many roles run that many meetings (sales, recruiting, EAs).
- Spotify hours > 80 ≠ composer. That's a heavy listener, not a maker.
- GitHub commits > 100 ≠ engineer-of-record. Could be config repos or a side project.

Prefer `has_aspect` matches — the user's own stated Habits, Goals, Beliefs, Preferences — over volumetric proxies. When self-description and volume disagree, self-description wins.

### Precedence ladder

When more than one variant is in the running, rank by this ladder. Higher steps beat lower steps; ties within a step move down.

1. **Primary self-described role.** A CORE aspect like `Habit: "ship code"`, `Belief: "I am a teacher"`, or a label literally named after the craft.
2. **Recent repeated behavior.** Observed over the last 30–60 days from CORE state — multiple weeks of the same activity, not a single spike.
3. **Integration corroboration.** A connected tool that fits the variant and shows nontrivial activity. Never sufficient on its own.
4. **LLM judge tie-break.** When the top two candidates are within 0.15 of each other on score, the judge gets the user summary + both candidate variants + the question "which one is MORE this person?" and picks one.

### Known close-call pairs

Pairs where two or more variants genuinely overlap and the precedence ladder above MUST run. Make sure each has a deterministic resolution before we ship.

- `office.hacker-cabin` vs `office.drafting-table` — designer-who-codes.
- `office.hacker-cabin` vs `office.founders-desk` — founder-who-codes (the founder variant currently lives as `office.whiteboard-room`; will rename once founders-desk lands as its own variant).
- `office.field-notes` vs `library.the-study` — academic vs reader.
- `studio.practice-room` vs `studio.the-booth` vs `stage.footlight-hall` — performer-archetype precedence (musician vs broadcaster vs stage performer).

---

_End of draft. Path: `/Users/harshithmullapudi/Documents/town-next/docs/variant-catalog-draft.md`._
