# Eco-Nur Skin Quiz — Developer Guide

A modular, config-driven skincare quiz. Adding questions, editing products, changing
result copy, or tweaking recommendation logic requires **only JSON edits** — no JavaScript changes.

---

## File Structure

```
eco-nur-quiz/
│
├── script.js                   ← Entry point. Configure WEBHOOK_URL and WHATSAPP_NUMBER here.
│
├── modules/
│   ├── utils.js                ← Pure helpers: $(), $$(), toBnDigits(), localize(), interpolate()
│   ├── state.js                ← Centralized quiz state (single source of truth)
│   ├── i18n.js                 ← Locale loader: t('key') and getLocaleValue('key')
│   ├── scoring.js              ← Score computation, primary/secondary type detection
│   ├── branching.js            ← Conditional question visibility engine
│   ├── recommender.js          ← Product recommendation engine (override rules + mapping)
│   ├── renderer.js             ← All DOM rendering (owns every write to the page)
│   └── lead.js                 ← Lead validation and webhook submission
│
└── config/
    ├── questions.json          ← Question bank (add/remove/edit questions here)
    ├── products.json           ← Product catalog (add/remove/edit products here)
    ├── results.json            ← Skin type profiles and personalized insight templates
    ├── recommendation.json     ← Skin type → product mapping and answer override rules
    └── i18n/
        ├── bn.json             ← Bengali UI strings
        └── en.json             ← English UI strings (scaffold, activate when needed)
```

---

## HTML Requirements

Your `index.html` needs these elements. IDs must match exactly.

### Landing Section
```html
<section id="sec-landing" class="sec active">
    <input id="inp-landing-name" type="text" />  <!-- optional name, may be omitted -->
    <button id="btn-start">পরীক্ষা শুরু করুন</button>
</section>
```

### Quiz Section
```html
<section id="sec-quiz" class="sec">
    <div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div id="progress-fill"></div>
    </div>
    <span id="q-counter"></span>
    <span id="q-pct"></span>

    <div id="q-card">
        <div id="q-badge"></div>
        <p id="q-hint"></p>
        <h2 id="q-text"></h2>
        <div id="options-grid" role="radiogroup"></div>
    </div>

    <button id="btn-prev">আগে</button>
    <button id="btn-next">পরবর্তী</button>
</section>
```

### Lead Gate Section
```html
<section id="sec-lead-gate" class="sec">
    <input  id="inp-name"   type="text" />
    <select id="inp-gender"></select>          <!-- options injected by initLeadGate() -->
    <input  id="inp-wa"     type="tel" />
    <p      id="lead-msg"   class="lead-msg"></p>
    <button id="btn-lead-gate">ফলাফল দেখুন →</button>
</section>
```

### Result Section
```html
<section id="sec-result" class="sec">
    <span id="r-emoji"></span>
    <h2   id="r-headline"></h2>
    <span id="r-badge"></span>
    <div  id="r-second-badge"></div>        <!-- hidden if no secondary type -->
    <p    id="r-insight"></p>
    <div  id="r-problems"></div>
    <div  id="r-advice"></div>

    <!-- Product card -->
    <span id="soap-emoji"></span>
    <span id="soap-name"></span>
    <span id="soap-price"></span>
    <p    id="soap-why"></p>
    <a    id="soap-order-btn" target="_blank" rel="noopener">অর্ডার করুন</a>

    <!-- Testimonials (hidden if empty) -->
    <div id="testimonials"></div>

    <button id="btn-retake">আবার পরীক্ষা দিন</button>
</section>
```

### Script Tag
Use `type="module"` — required for ES module imports:
```html
<script type="module" src="./script.js"></script>
```

---

## Common Tasks

### Add a new question

Edit `config/questions.json`. Add an entry to the `questions` array:

```json
{
  "id": "q10",
  "text": { "bn": "...", "en": "..." },
  "hint": { "bn": "...", "en": "..." },
  "showIf": null,
  "options": [
    {
      "id": "q10_dry",
      "text": { "bn": "...", "en": "..." },
      "scores": { "D": 2 },
      "signals": ["dry"]
    }
  ]
}
```

That's it. No JS changes needed.

---

### Make a question conditional (branching)

Set `showIf` to a rule object. Currently supported rule type: `anySignal`.

```json
"showIf": {
  "type": "anySignal",
  "questions": ["q1", "q2"],
  "signals": ["oily", "combination"]
}
```

This shows the question only if Q1 or Q2 was answered with an option
carrying the `oily` or `combination` signal.

To add a new signal type, add cases to `isQuestionVisible()` in `modules/branching.js`.

---

### Add or edit a product

Edit `config/products.json`. Add a new key under `products`:

```json
"new-product-id": {
  "id": "new-product-id",
  "name": { "bn": "...", "en": "..." },
  "emoji": "🌱",
  "price": { "bn": "৳XXX", "en": "৳XXX" },
  "tagline": { "bn": "...", "en": "..." },
  "keyIngredients": { "bn": [...], "en": [...] },
  "whyText": { "bn": "...", "en": "..." },
  "suitableFor": ["O"],
  "notSuitableFor": ["D"],
  "isCustom": false,
  "bundle": null,
  "testimonials": [...]
}
```

Then add it to the `primaryMapping` or an `answerOverride` rule in `config/recommendation.json`.

---

### Change which product a skin type gets

Edit `config/recommendation.json` → `primaryMapping`:

```json
"primaryMapping": {
  "O": "active-defense",
  "D": "olivelle"   ← change this
}
```

---

### Add a recommendation override rule

When a specific answer should override the default mapping, add to `answerOverrides`:

```json
{
  "id": "override_my_rule",
  "triggerAnswer": "q5_burn",
  "appliesWhenPrimaryIs": ["D"],
  "overrideProduct": "olivelle",
  "reason": "Why this override exists (for humans)"
}
```

---

### Edit result page copy

Edit `config/results.json`. Each skin type has:
- `insightTemplate` — personalized paragraph. Supports `{{name}}` and `{{secondaryInsight}}`.
- `secondaryInsights` — snippets injected into `{{secondaryInsight}}` when a secondary type exists.
- `problems` — array rendered as a bullet list.
- `advice` — array rendered as a bullet list.

---

### Add a lead field (e.g. email)

1. Add `<input id="inp-email" type="email" />` to the lead gate HTML.
2. In `script.js` → `submitLeadGate()`, read: `const email = $('#inp-email')?.value.trim()`.
3. In `modules/lead.js` → `validateLead()`, add a validation rule.
4. In `modules/lead.js` → `buildPayload()`, add `email` to the returned object.
5. Add the label string to `config/i18n/bn.json` and `en.json`.

---

### Activate English language

1. Complete the translations in `config/i18n/en.json`.
2. Complete the `en` strings in `questions.json`, `products.json`, `results.json`.
3. In `script.js`, change `DEFAULT_LOCALE` to `'en'`, or add a language toggle UI
   that calls `loadLocale('en')` and re-renders the current view.

---

## Architecture Decisions

**Why ES modules?**
Native browser support, no build step required, clear dependency graph, and
each module's responsibilities are explicit at the import level.

**Why JSON configs instead of JS objects?**
JSON is editable by non-developers, readable by AI tools, version-controllable,
and can eventually be served from a CMS without changing any JS.

**Why is `renderer.js` the only module that touches the DOM?**
It makes DOM structure changes isolated to one file, and keeps all other
modules unit-testable without a browser environment.

**Why is scoring computed only once (in `submitLeadGate`)?**
The original code called `computeSkinType()` twice independently. Computing
once and storing in state ensures the result page always matches the webhook payload.

**Why does `lead.js` accept `t` as a parameter instead of importing it?**
It keeps `lead.js` decoupled from the i18n module, making it easier to test
and to swap out the translation mechanism in the future.
