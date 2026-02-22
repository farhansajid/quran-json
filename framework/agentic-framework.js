const fs = require('fs');
const path = require('path');

const QURAN_PATH = path.resolve(__dirname, '..', 'dist', 'quran_en.json');

function loadQuran() {
  const raw = fs.readFileSync(QURAN_PATH, 'utf8');
  const chapters = JSON.parse(raw);

  return chapters.flatMap(chapter =>
    chapter.verses.map(verse => ({
      chapter: chapter.id,
      chapterName: chapter.transliteration,
      verse: verse.id,
      text: verse.text,
      translation: verse.translation
    }))
  );
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(query) {
  const stopWords = new Set([
    'the', 'and', 'or', 'in', 'on', 'at', 'of', 'to', 'for', 'a', 'an', 'is',
    'are', 'with', 'from', 'about', 'what', 'how', 'why', 'which', 'who', 'when',
    'does', 'do', 'can', 'could', 'should', 'would', 'explain', 'understand',
    'quran', 'verse', 'verses', 'say', 'says', 'during', 'about'
  ]);

  return normalize(query)
    .split(' ')
    .filter(Boolean)
    .filter(token => !stopWords.has(token));
}

function classifyIntent(query) {
  const q = normalize(query);
  if (q.includes('law') || q.includes('halal') || q.includes('haram')) {
    return 'legal-guidance';
  }
  if (q.includes('story') || q.includes('prophet') || q.includes('history')) {
    return 'narrative-understanding';
  }
  if (q.includes('faith') || q.includes('believe') || q.includes('allah')) {
    return 'theological';
  }
  if (q.includes('character') || q.includes('ethic') || q.includes('patience')) {
    return 'ethical-development';
  }
  return 'general-inquiry';
}

function scoreVerse(verse, keywords) {
  const haystack = normalize(`${verse.text} ${verse.translation}`);
  let score = 0;

  for (const keyword of keywords) {
    if (haystack.includes(keyword)) {
      score += 1;
    }
  }

  if (verse.chapterName) {
    const chapterName = normalize(verse.chapterName);
    if (keywords.some(keyword => chapterName.includes(keyword))) {
      score += 1;
    }
  }

  return score;
}

function retrieveEvidence(dataset, query, maxVerses = 5) {
  const keywords = extractKeywords(query);
  const scored = dataset
    .map(verse => ({
      verse,
      score: scoreVerse(verse, keywords)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxVerses);

  return {
    keywords,
    verses: scored.map(item => ({
      chapter: item.verse.chapter,
      verse: item.verse.verse,
      chapterName: item.verse.chapterName,
      text: item.verse.text,
      translation: item.verse.translation,
      score: item.score
    }))
  };
}

function synthesizeAnswer(intent, query, evidence) {
  if (!evidence.verses.length) {
    return {
      summary:
        'I could not confidently locate strong verse matches for this query. Try using key themes (e.g., patience, justice, mercy, prayer).',
      caution:
        'This framework is retrieval-based and not a substitute for qualified scholarly tafsir.'
    };
  }

  const bulletPoints = evidence.verses.map(
    v => `${v.chapterName} (${v.chapter}:${v.verse}) — ${v.translation}`
  );

  return {
    summary: `Intent detected: ${intent}. The verses below are the closest thematic matches for: "${query}"`,
    evidence: bulletPoints,
    caution:
      'For interpretation depth, compare multiple translations and consult trusted tafsir sources.'
  };
}

function runFramework(query, options = {}) {
  const dataset = loadQuran();
  const intent = classifyIntent(query);
  const evidence = retrieveEvidence(dataset, query, options.maxVerses || 5);

  return {
    query,
    intent,
    retrieval: {
      keywords: evidence.keywords,
      totalMatches: evidence.verses.length
    },
    result: synthesizeAnswer(intent, query, evidence),
    rawEvidence: evidence.verses
  };
}

if (require.main === module) {
  const query = process.argv.slice(2).join(' ').trim();

  if (!query) {
    console.error('Usage: node framework/agentic-framework.js "your question about Quran"');
    process.exit(1);
  }

  const output = runFramework(query);
  console.log(JSON.stringify(output, null, 2));
}

module.exports = {
  runFramework,
  classifyIntent,
  retrieveEvidence,
  synthesizeAnswer,
  extractKeywords
};
