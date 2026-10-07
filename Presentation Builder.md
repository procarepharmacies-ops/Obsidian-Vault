---
name: presentation-builder
description: "Create stunning self-contained HTML slide deck presentations. Trigger when user asks to create an HTML presentation, slide deck, slides, pitch deck, or wants to turn content into a visual presentation. Also trigger on 'make a presentation about X', 'create slides for X', 'build a deck about X'. If the user mentions presentations, slides, or decks and wants HTML output (not .pptx), use this skill."
---

# Presentation Builder

Creates self-contained HTML slide decks that look like they were designed by a studio. The user controls the style, density, and whether images are generated. The final output is a single `.html` file with everything embedded — opens in any browser, no dependencies.

---

## STEP 1: ASK SETUP QUESTIONS

Before writing any HTML, present this checklist. The user's answers drive every decision. Present it conversationally — don't dump a wall of text.

> **Let me ask a few quick questions so I nail the style:**
>
> 1. **Topic** — What's this presentation about? Give me a summary or paste your content and I'll structure it.
> 2. **Audience** — Who's watching? (investors, team, students, social media, general public?)
> 3. **Purpose** — What type of deck? Pick one or describe:
>    - **Explainer** — Teach a concept step by step
>    - **Pitch** — Sell an idea, product, or yourself
>    - **Demo** — Walk through how something works
>    - **Storytelling** — Narrative arc, emotional journey
>    - **Report** — Data, results, findings
> 4. **Density** — How much per slide?
>    - **Minimal** — One big statement per slide, lots of whitespace, 25-40 slides (best for screen recording, YouTube, keynotes)
>    - **Standard** — A heading + a few supporting points per slide, 15-25 slides (best for meetings, workshops)
>    - **Compact** — More content per slide, 8-15 slides (best for async reading, email decks)
> 5. **Colour mode** — Dark background (white text) or light background (dark text)?
> 6. **Accent colour** — One highlight colour for key phrases. Pick one or give me a hex code:
>    - Light blue, Orange, Green, Purple, Red, Gold, Pink, Teal — or your brand colour
> 7. **Font vibe** — Pick one:
>    - **Modern/clean** (Space Grotesk)
>    - **Rounded/friendly** (Nunito)
>    - **Sharp/editorial** (Inter)
>    - **Bold/startup** (Outfit)
>    - **Classic/corporate** (Lora serif)
>    - Or name a specific Google Font
> 8. **Logos** — Should I include logos for any tools, brands, or companies mentioned? Which ones?
> 9. **Animations** — Want animated slides? (step-by-step reveals, VS comparisons, pipeline flows) Yes/No
> 10. **Images** — Want me to generate infographic images to illustrate key concepts?
>     - **No** — Text-only deck, I'll build it fast
>     - **Yes** — I'll use the Kie.ai API to generate images. You'll need an API key from https://kie.ai — paste it when ready

Wait for answers. If the user says "just do it" or "your call," use these defaults:
- Dark mode, light blue accent (#64b4ff), Space Grotesk, minimal density, logos if relevant, animations yes, no generated images

---

## STEP 2: PLAN THE SLIDE STRUCTURE

Based on the topic and purpose, draft a slide-by-slide outline BEFORE writing any code. Show it to the user for approval. Format:

```
Slide 1: [Title] — type: text
Slide 2: [Problem statement] — type: text
Slide 3: [Key concept] — type: text + image
...
```

Use these structure patterns as starting points (adapt freely):

### Explainer Deck
Title > Problem/status quo > The fix (one line) > Concept introductions (one per slide) > Visual storytelling sequence (analogy that builds across 3-5 slides) > Animated how-it-works > Comparison > Use cases (one per slide) > Closing/CTA

### Pitch Deck
Title > Problem > Solution (one line) > How it works (3-step animated) > Market/opportunity > Traction/proof > Business model > VS competitors > Team > The ask/CTA

### Demo Deck
Title > What it does (one line) > Before state > After state > Walkthrough steps (one per slide, with images) > Key features > Results/numbers > CTA

### Storytelling Deck
Title > Hook (question or bold claim) > Context/backstory > Turning point > The insight > Evidence/proof > Implications > Closing

### Report Deck
Title > Executive summary > Key findings (one per slide) > Data visualizations > Comparisons > Recommendations > Next steps

### Slide Count Guide
- **Minimal density:** ~3 slides per key concept, ~3 slides per minute of speaking time
- **Standard density:** ~2 slides per key concept
- **Compact density:** ~1 slide per key concept

Get user approval on the outline before proceeding.

---

## STEP 3: BUILD THE HTML

Create a single self-contained HTML file. Use the CSS system below, adapted to the user's style choices.

### File Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark"> <!-- or "light" -->
  <title>{Presentation Title}</title>
  <style>/* All CSS here */</style>
</head>
<body>
  <div class="bar" id="bar"></div>
  <div class="cnt" id="cnt"></div>
  <!-- Slides here -->
  <script>/* Navigation JS here */</script>
</body>
</html>
```

### CSS System

Build CSS variables from the user's answers. Below are the dark-mode defaults — invert for light mode.

```css
@import url('https://fonts.googleapis.com/css2?family={CHOSEN_FONT}:wght@400;500;600;700&display=swap');

*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:'{CHOSEN_FONT}',system-ui,sans-serif}

:root {
  /* DARK MODE DEFAULTS — adjust per user's answers */
  --bg: #08090e;
  --text: #fff;
  --text-dim: rgba(255,255,255,0.45);
  --highlight: rgba(100,180,255,0.18);      /* accent at ~18% opacity */
  --highlight-glow: rgba(100,180,255,0.08); /* accent at ~8% for shadow */
  --progress: rgba(100,180,255,0.6);        /* accent at ~60% for bar */

  /* LIGHT MODE ALTERNATIVE:
  --bg: #fafafa;
  --text: #111;
  --text-dim: rgba(0,0,0,0.45);
  --highlight: rgba(100,180,255,0.15);
  --highlight-glow: rgba(100,180,255,0.06);
  --progress: rgba(100,180,255,0.7);
  */
}
```

### Core Slide CSS

```css
.slide{
  position:fixed;inset:0;
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  opacity:0;pointer-events:none;transition:opacity 0.45s ease;
  padding:60px 80px;text-align:center;cursor:pointer;
}
.slide.on{opacity:1;pointer-events:auto}

h1{font-size:clamp(3rem,7vw,6.5rem);font-weight:700;line-height:1.05;letter-spacing:-3px}
h2{font-size:clamp(2.4rem,5vw,4.2rem);font-weight:700;line-height:1.2;letter-spacing:-1.5px}
h3{font-size:clamp(1.4rem,2.5vw,2rem);font-weight:600;line-height:1.2}
.sub{font-size:clamp(1.1rem,1.8vw,1.5rem);color:var(--text-dim);margin-top:16px;font-weight:400;max-width:700px;line-height:1.5}
```

### Highlight System

Primary highlight uses the accent colour. Create 3 complementary colours for multi-term slides.

```css
/* Primary highlight — MUST use white-space:nowrap to prevent wrapping overlap */
.hl{
  background:var(--highlight);
  padding:4px 16px;border-radius:10px;
  display:inline;
  box-decoration-break:clone;-webkit-box-decoration-break:clone;
  white-space:nowrap;
  box-shadow:0 0 20px var(--highlight-glow);
}

/* Secondary highlights for multi-term slides — pick 3 that complement the accent */
.hl-b{background:rgba(80,220,140,0.18);padding:4px 14px;border-radius:10px;display:inline;white-space:nowrap}
.hl-c{background:rgba(180,120,255,0.18);padding:4px 14px;border-radius:10px;display:inline;white-space:nowrap}
.hl-d{background:rgba(255,180,50,0.18);padding:4px 14px;border-radius:10px;display:inline;white-space:nowrap}

.dim{color:var(--text-dim)}
.pop{color:var(--text)}
```

**Rule:** Only highlight 2-4 words per slide. Never highlight full sentences. If a highlighted phrase is too long for one line, shorten the phrase.

### Infographic Image Container

```css
.infographic{
  max-width:720px;width:88%;margin-top:28px;
  border-radius:20px;overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,0.6);
  border:1px solid rgba(255,255,255,0.06);
  background:#111;
}
.infographic img{width:100%;display:block}
```

### Tool/Brand Logo

```css
.tool-logo{height:60px;margin-bottom:20px;opacity:0.85}
```

### Animated: 3-Step Reveal

```css
.steps{display:flex;gap:clamp(20px,3vw,40px);margin-top:48px;flex-wrap:wrap;justify-content:center}
.step{
  flex:1;min-width:220px;max-width:300px;text-align:center;padding:36px 24px;
  border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
  opacity:0;transform:translateY(40px);
  transition:all 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
.step.in{opacity:1;transform:translateY(0)}
.step .icon{font-size:3.5rem;margin-bottom:16px}
.step h3{font-size:1.4rem;margin-bottom:10px}
.step p{font-size:0.95rem;color:var(--text-dim);line-height:1.5}
```

### Animated: VS Comparison

```css
.vs-row{display:flex;align-items:center;gap:clamp(24px,5vw,60px);margin-top:48px;flex-wrap:wrap;justify-content:center}
.vs-box{text-align:center;opacity:0;transition:all 0.5s ease}
.vs-box.l{transform:translateX(-50px)}
.vs-box.r{transform:translateX(50px)}
.vs-box.in{opacity:1;transform:translateX(0)}
.vs-box img{height:40px;margin-bottom:12px;opacity:0.7}
.vs-box .big{font-size:clamp(4.5rem,10vw,9rem);font-weight:700;line-height:1}
.vs-box .label{font-size:1.1rem;color:var(--text-dim);margin-top:8px}
.vs-x{font-size:2.5rem;color:rgba(255,255,255,0.1);font-weight:700}
```

### Animated: Pipeline Flow

```css
.pipe{display:flex;align-items:center;gap:0;margin-top:48px;justify-content:center;flex-wrap:wrap}
.node{
  width:100px;height:100px;border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);
  opacity:0;transform:scale(0.7);
  transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.node.in{opacity:1;transform:scale(1);border-color:var(--progress)}
.node img{height:36px;margin-bottom:6px}
.node span{font-size:0.7rem;color:var(--text-dim)}
.wire{
  width:60px;height:2px;background:rgba(255,255,255,0.06);
  position:relative;overflow:hidden;
}
.wire::after{
  content:'';position:absolute;inset:0;
  background:var(--progress);
  transform:scaleX(0);transform-origin:left;
  transition:transform 0.4s ease;
}
.wire.in::after{transform:scaleX(1)}
```

### Animated: Stat/Number Counter

```css
.stat{
  font-size:clamp(5rem,12vw,10rem);font-weight:700;
  opacity:0;transform:scale(0.8);
  transition:all 0.6s cubic-bezier(0.34,1.56,0.64,1);
}
.stat.in{opacity:1;transform:scale(1)}
.stat-label{font-size:clamp(1rem,2vw,1.4rem);color:var(--text-dim);margin-top:12px}
```

### Progress Bar + Counter

```css
.bar{position:fixed;top:0;left:0;height:2px;background:var(--progress);z-index:99;transition:width 0.3s}
.cnt{position:fixed;bottom:16px;right:20px;font-size:0.7rem;color:rgba(255,255,255,0.12);z-index:99}
```

### Responsive

```css
@media(max-width:768px){
  .slide{padding:32px 24px}
  .steps{flex-direction:column;align-items:center}
  .vs-row{flex-direction:column}
  .pipe{flex-direction:column}
}
```

### Standard Density Additions

When the user picks **standard** or **compact** density, add these:

```css
/* Bullet-free list for standard/compact density */
.points{list-style:none;margin-top:28px;text-align:left;max-width:700px}
.points li{
  font-size:clamp(1.1rem,2vw,1.5rem);
  padding:12px 0;
  border-bottom:1px solid rgba(255,255,255,0.06);
  color:var(--text-dim);
}
.points li strong{color:var(--text)}

/* Two-column layout for compact density */
.cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:36px;text-align:left;max-width:900px}
.col h3{margin-bottom:12px}
.col p{font-size:1rem;color:var(--text-dim);line-height:1.6}
```

---

## NAVIGATION JAVASCRIPT

Include this at the bottom of every presentation. It handles keyboard, click, touch, and animated slide triggers.

```javascript
(function(){
  var S=document.querySelectorAll('.slide'),
      bar=document.getElementById('bar'),
      cnt=document.getElementById('cnt'),
      c=0;

  function show(i){
    if(i<0||i>=S.length)return;
    S[c].classList.remove('on');
    c=i;
    S[c].classList.add('on');
    bar.style.width=((c+1)/S.length*100)+'%';
    cnt.textContent=(c+1)+'/'+S.length;
    anim();
  }

  function anim(){
    // Reset all animated elements
    document.querySelectorAll('.step,.vs-box,.node,.wire,.stat').forEach(function(e){
      e.classList.remove('in');
    });
    var s=S[c];
    // Trigger animations for current slide
    var steps=s.querySelectorAll('.step');
    if(steps.length) steps.forEach(function(e,i){setTimeout(function(){e.classList.add('in')},i*300)});
    var vsBoxes=s.querySelectorAll('.vs-box');
    if(vsBoxes.length) setTimeout(function(){vsBoxes.forEach(function(e){e.classList.add('in')})},200);
    var nodes=s.querySelectorAll('.node');
    var wires=s.querySelectorAll('.wire');
    if(nodes.length){
      nodes.forEach(function(e,i){setTimeout(function(){e.classList.add('in')},i*400)});
      wires.forEach(function(e,i){setTimeout(function(){e.classList.add('in')},i*400+200)});
    }
    var stats=s.querySelectorAll('.stat');
    if(stats.length) setTimeout(function(){stats.forEach(function(e){e.classList.add('in')})},150);
  }

  // Keyboard
  document.addEventListener('keydown',function(e){
    if(['ArrowRight','ArrowDown',' '].indexOf(e.key)>-1){e.preventDefault();show(c+1)}
    if(['ArrowLeft','ArrowUp'].indexOf(e.key)>-1){e.preventDefault();show(c-1)}
    if(e.key==='Escape'){e.preventDefault();show(0)}
    if(e.key==='End'){e.preventDefault();show(S.length-1)}
    if(e.key==='Home'){e.preventDefault();show(0)}
  });

  // Click (right half = next, left half = prev)
  document.body.addEventListener('click',function(e){
    e.clientX>innerWidth/2?show(c+1):show(c-1);
  });

  // Touch swipe
  var tx=0;
  document.body.addEventListener('touchstart',function(e){tx=e.touches[0].clientX});
  document.body.addEventListener('touchend',function(e){
    var d=e.changedTouches[0].clientX-tx;
    if(Math.abs(d)>50){d<0?show(c+1):show(c-1)}
  });

  // Init
  cnt.textContent='1/'+S.length;
  bar.style.width=(1/S.length*100)+'%';
})();
```

---

## STEP 4: IMAGES (OPTIONAL)

Only do this step if the user answered **Yes** to images in the setup.

### If user wants generated images:

Tell them:

> To generate images, I'll use the Kie.ai API. Here's what you need:
> 1. Go to **https://kie.ai** and create an account
> 2. Navigate to your API settings and copy your API key
> 3. Paste it here and I'll handle the rest

Once they provide the key:

1. **Write detailed prompts** — Kie.ai handles up to 20,000 characters. More detail = better output. Describe the scene, style, colours, composition, mood, and what text/labels should appear.
2. **Submit to API:**
   - Endpoint: `https://api.kie.ai/api/v1/jobs/createTask`
   - Poll `recordInfo` every 5 seconds until complete
   - Download the result images
3. **Process images:**
   - Resize to 1000px wide max
   - Compress to JPEG quality 80
   - Convert to base64 data URIs
4. **Embed** directly into the HTML `<img src="data:image/jpeg;base64,...">` tags

Two image styles to choose from per image:
- **Visual Explainer** — Images + mini diagrams + metaphors. Best for educational content.
- **Image-Led** — Poster energy, dominant visual, minimal text. Best for hero/title slides.

### If user wants their own images:

Tell them to provide image files or URLs. Resize, compress, and base64-encode them the same way.

### If no images:

Skip entirely. Text-only decks are fast and still look great with this CSS system.

---

## STEP 5: LOGOS (OPTIONAL)

If the user wants logos for tools/brands:

1. Ask which ones
2. Source them: try GitHub avatars (`https://github.com/{org}.png`), official CDNs, or search for SVG/PNG versions
3. Resize to 80px height, keep transparency
4. Base64 encode as PNG data URIs
5. Use in `<img class="tool-logo" src="data:image/png;base64,...">` tags

If a logo can't be found, use an emoji or styled text fallback instead of a broken image.

---

## STEP 6: ASSEMBLE AND DELIVER

1. Build the complete HTML with all CSS, content, images (if any), and JS in a single file
2. Save to the user's preferred location (default: `~/Desktop/{topic}-presentation.html`)
3. Confirm the file size — should be under 2MB without images, under 5MB with images
4. Tell the user: *"Open it in any browser. Arrow keys or click to navigate. Works on mobile too."*

---

## SLIDE TYPE QUICK REFERENCE

When building slides, use these HTML patterns:

### Text Slide (most common)
```html
<div class="slide">
  <h2>Your headline with a<br><span class="hl">highlighted phrase</span></h2>
  <p class="sub">Optional one-line subtitle</p>
</div>
```

### Text + Logo
```html
<div class="slide">
  <img class="tool-logo" src="..." alt="Tool Name">
  <h2>Tool Name</h2>
  <p class="sub">One line about what it does</p>
</div>
```

### Image Slide
```html
<div class="slide">
  <div class="infographic">
    <img src="..." alt="Description">
  </div>
</div>
```

### Text + Image
```html
<div class="slide">
  <h2>Headline <span class="hl">here</span></h2>
  <div class="infographic">
    <img src="..." alt="Description">
  </div>
</div>
```

### 3-Step Animated
```html
<div class="slide">
  <h2>Heading</h2>
  <div class="steps">
    <div class="step"><div class="icon">EMOJI</div><h3>Step 1</h3><p>One line</p></div>
    <div class="step"><div class="icon">EMOJI</div><h3>Step 2</h3><p>One line</p></div>
    <div class="step"><div class="icon">EMOJI</div><h3>Step 3</h3><p>One line</p></div>
  </div>
</div>
```

### VS Comparison Animated
```html
<div class="slide">
  <h2>Heading</h2>
  <div class="vs-row">
    <div class="vs-box l"><div class="big pop">VALUE</div><div class="label">Label</div></div>
    <div class="vs-x">vs</div>
    <div class="vs-box r"><div class="big dim">VALUE</div><div class="label">Label</div></div>
  </div>
</div>
```

### Pipeline Animated
```html
<div class="slide">
  <h2>Heading</h2>
  <div class="pipe">
    <div class="node"><img src="..." alt=""><span>Label</span></div>
    <div class="wire"></div>
    <div class="node"><img src="..." alt=""><span>Label</span></div>
    <div class="wire"></div>
    <div class="node"><img src="..." alt=""><span>Label</span></div>
  </div>
</div>
```

### Big Stat Animated
```html
<div class="slide">
  <div class="stat">47%</div>
  <div class="stat-label">of teams report this problem</div>
</div>
```

### Standard Density: Points List
```html
<div class="slide">
  <h2>Heading</h2>
  <ul class="points">
    <li><strong>Key term</strong> — supporting detail in one line</li>
    <li><strong>Key term</strong> — supporting detail in one line</li>
    <li><strong>Key term</strong> — supporting detail in one line</li>
  </ul>
</div>
```

### Compact Density: Two Columns
```html
<div class="slide">
  <h2>Heading</h2>
  <div class="cols">
    <div class="col"><h3>Left</h3><p>Content here</p></div>
    <div class="col"><h3>Right</h3><p>Content here</p></div>
  </div>
</div>
```

---

## HARD RULES

- Always ask the setup questions before building
- Always show the slide outline for approval before writing HTML
- Never put more than one concept per slide (in minimal density)
- Highlights MUST use `white-space: nowrap` — never skip this
- Only highlight 2-4 words per slide, never full sentences
- Infographic images always go inside `.infographic` container (rounded corners, shadow)
- All images and logos must be base64 embedded — the final HTML must be fully self-contained, zero external dependencies except the Google Font import
- If file size exceeds 5MB, compress images more aggressively
- Never use tables in slides
- In minimal density: never use bullet points, never write paragraphs
- In standard/compact density: use `.points` list or `.cols` grid, still keep text minimal
- Animated slides only when user said yes to animations
- Test that the first slide has class `on` so it's visible on load

---

## EXAMPLE PROMPTS

These show what users might say and what to expect:

**Quick text-only deck:**
> "Make a 10-slide presentation about why startups fail. Dark mode, orange accents, no images."
> Expected: ~15 slides minimal density, text-only, fast build

**Full featured:**
> "Create a pitch deck for my AI scheduling tool aimed at investors. Include logos for Google Calendar, Slack, and Notion. Generate images. Blue accent."
> Expected: ~20 slides, pitch structure, logos sourced and embedded, Kie.ai images generated, animations on key slides

**Content dump:**
> "Here's my blog post about RAG systems [pastes 2000 words]. Turn this into a visual presentation."
> Expected: Ask setup questions, extract key points, structure into explainer deck, build slides

**Compact meeting deck:**
> "I need a quick 8-slide summary of our Q1 results for the team meeting. Light mode, compact, no animations."
> Expected: Compact density with `.points` lists, light theme, static slides
