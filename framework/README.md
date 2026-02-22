# Agentic Framework for Quran Understanding

This framework provides a simple multi-agent pipeline on top of this repository's Quran JSON data.

## Agent Pipeline

1. **Intent Agent**
   - Classifies the user query into rough categories:
     - theological
     - legal-guidance
     - narrative-understanding
     - ethical-development
     - general-inquiry

2. **Retrieval Agent**
   - Extracts meaningful keywords from the query.
   - Scores verses in `dist/quran_en.json` by keyword overlap.
   - Returns top verse candidates.

3. **Synthesis Agent**
   - Produces a concise response grounded in retrieved verses.
   - Adds caution to encourage tafsir-based validation.

## Usage

```bash
node framework/agentic-framework.js "What does the Quran say about patience during hardship?"
```

## Programmatic Usage

```js
const { runFramework } = require('./framework/agentic-framework');

const result = runFramework('What does the Quran say about justice?');
console.log(result);
```

## Notes

- This is a retrieval-first framework for study assistance, not a fatwa or scholarly ruling engine.
- You can extend it with:
  - multilingual retrieval using other `dist/quran_*.json` files,
  - semantic embedding search,
  - tafsir corpora integration,
  - citation confidence thresholds.
