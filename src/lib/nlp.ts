// Lightweight browser NLP toolkit: tokenize, stopwords, stem, lemmatize,
// n-grams, POS, NER, TF-IDF, PCA, t-SNE.

export const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves`.split(
    /\s+/,
  ),
);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]*/g) || []);
}

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

// Compact Porter stemmer
export function stem(w: string): string {
  let s = w.toLowerCase();
  if (s.length < 3) return s;
  s = s.replace(/(ss|i)es$/, '$1').replace(/([^s])s$/, '$1');
  s = s.replace(/(eed)$/, 'ee');
  s = s.replace(/(ed|ing)$/, '');
  s = s.replace(/(ly|ment|ness|tion|ation|ities|ity|ous|ive|ful|less)$/, '');
  return s || w;
}

// Tiny rule-based lemmatizer
const LEMMA: Record<string, string> = {
  was: 'be', were: 'be', is: 'be', are: 'be', am: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  did: 'do', done: 'do', doing: 'do', does: 'do',
  went: 'go', gone: 'go', going: 'go',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad',
  children: 'child', men: 'man', women: 'woman', people: 'person', mice: 'mouse', feet: 'foot',
};
export function lemmatize(w: string): string {
  const l = w.toLowerCase();
  if (LEMMA[l]) return LEMMA[l];
  if (l.endsWith('ies') && l.length > 4) return l.slice(0, -3) + 'y';
  if (l.endsWith('sses')) return l.slice(0, -2);
  if (l.endsWith('ses') && l.length > 4) return l.slice(0, -1);
  if (l.endsWith('s') && !l.endsWith('ss') && l.length > 3) return l.slice(0, -1);
  if (l.endsWith('ing') && l.length > 5) return l.slice(0, -3);
  if (l.endsWith('ed') && l.length > 4) return l.slice(0, -2);
  return l;
}

export function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) out.push(tokens.slice(i, i + n).join(' '));
  return out;
}

export function topK(items: string[], k = 15): { term: string; count: number }[] {
  const m = new Map<string, number>();
  items.forEach((t) => m.set(t, (m.get(t) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([term, count]) => ({ term, count }));
}

// Very lightweight POS tagger (lexicon + suffix rules)
const POS_LEX: Record<string, string> = {
  the: 'DET', a: 'DET', an: 'DET', this: 'DET', that: 'DET', these: 'DET', those: 'DET',
  i: 'PRON', you: 'PRON', he: 'PRON', she: 'PRON', it: 'PRON', we: 'PRON', they: 'PRON',
  and: 'CONJ', or: 'CONJ', but: 'CONJ', if: 'CONJ', because: 'CONJ',
  in: 'PREP', on: 'PREP', at: 'PREP', of: 'PREP', for: 'PREP', with: 'PREP', to: 'PREP', from: 'PREP', by: 'PREP',
  is: 'VERB', are: 'VERB', was: 'VERB', were: 'VERB', be: 'VERB', been: 'VERB', being: 'VERB', have: 'VERB', has: 'VERB', had: 'VERB', do: 'VERB', does: 'VERB', did: 'VERB',
  not: 'ADV', very: 'ADV', so: 'ADV', too: 'ADV',
};
export function posTag(token: string): string {
  const t = token.toLowerCase();
  if (POS_LEX[t]) return POS_LEX[t];
  if (/^\d+(\.\d+)?$/.test(t)) return 'NUM';
  if (/(ly)$/.test(t)) return 'ADV';
  if (/(ing|ed|ize|ise|ate|ify)$/.test(t)) return 'VERB';
  if (/(ous|ful|less|ive|able|ible|al|ic|ish)$/.test(t)) return 'ADJ';
  if (/(tion|ment|ness|ity|ship|hood|ist|ism|er|or)$/.test(t)) return 'NOUN';
  return 'NOUN';
}

// Lightweight NER: capitalized sequences + simple gazetteers + patterns
const LOCATIONS = new Set(['usa', 'uk', 'india', 'china', 'europe', 'america', 'asia', 'germany', 'france', 'japan', 'london', 'paris', 'tokyo', 'delhi', 'mumbai', 'beijing', 'newyork']);
const ORGS = new Set(['inc', 'ltd', 'llc', 'corp', 'company', 'co', 'gmbh']);
export interface Entity { text: string; type: 'PERSON' | 'ORG' | 'LOC' | 'DATE' | 'NUM' }
export function extractEntities(text: string): Entity[] {
  const ents: Entity[] = [];
  const dateRe = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s*\d{0,4})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(text))) ents.push({ text: m[0], type: 'DATE' });
  const capRe = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;
  while ((m = capRe.exec(text))) {
    const phrase = m[1];
    const low = phrase.toLowerCase().replace(/\s+/g, '');
    if (LOCATIONS.has(low)) ents.push({ text: phrase, type: 'LOC' });
    else if ([...ORGS].some((o) => phrase.toLowerCase().includes(o))) ents.push({ text: phrase, type: 'ORG' });
    else if (phrase.split(/\s+/).length >= 2) ents.push({ text: phrase, type: 'PERSON' });
    else ents.push({ text: phrase, type: 'ORG' });
  }
  return ents;
}

// TF-IDF embedding of documents → matrix [docs x vocab]
export function tfidf(docs: string[][]): { matrix: number[][]; vocab: string[] } {
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  // Keep top 200 most common to bound size
  const vocab = [...df.entries()].sort((a, b) => b[1] - a[1]).slice(0, 200).map(([t]) => t);
  const idx = new Map(vocab.map((t, i) => [t, i]));
  const N = docs.length;
  const matrix = docs.map((d) => {
    const row = new Array(vocab.length).fill(0);
    const tf = new Map<string, number>();
    d.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    tf.forEach((c, t) => {
      const i = idx.get(t);
      if (i !== undefined) row[i] = (c / d.length) * Math.log(N / (df.get(t) || 1));
    });
    return row;
  });
  return { matrix, vocab };
}

// PCA → 2D (power iteration for top 2 components)
export function pca2D(X: number[][]): { x: number; y: number }[] {
  if (!X.length) return [];
  const n = X.length;
  const d = X[0].length;
  const mean = new Array(d).fill(0);
  X.forEach((r) => r.forEach((v, i) => (mean[i] += v / n)));
  const C = X.map((r) => r.map((v, i) => v - mean[i]));

  const matVec = (v: number[]) => {
    // (C^T C) v  computed as C^T (C v)
    const Cv = C.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
    const out = new Array(d).fill(0);
    for (let j = 0; j < n; j++) for (let i = 0; i < d; i++) out[i] += C[j][i] * Cv[j];
    return out;
  };
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  const power = (orth: number[][]) => {
    let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
    for (let it = 0; it < 30; it++) {
      v = matVec(v);
      orth.forEach((o) => {
        const dot = v.reduce((s, x, i) => s + x * o[i], 0);
        v = v.map((x, i) => x - dot * o[i]);
      });
      const nv = norm(v);
      v = v.map((x) => x / nv);
    }
    return v;
  };
  const pc1 = power([]);
  const pc2 = power([pc1]);
  return C.map((r) => ({
    x: r.reduce((s, v, i) => s + v * pc1[i], 0),
    y: r.reduce((s, v, i) => s + v * pc2[i], 0),
  }));
}

// Simple t-SNE-ish projection: PCA init + a few attraction/repulsion iterations
export function tsne2D(X: number[][], iters = 60): { x: number; y: number }[] {
  const pts = pca2D(X).map((p) => ({ x: p.x, y: p.y }));
  if (pts.length < 2) return pts;
  // normalize
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const sx = Math.max(...xs) - Math.min(...xs) || 1;
  const sy = Math.max(...ys) - Math.min(...ys) || 1;
  pts.forEach((p) => { p.x /= sx; p.y /= sy; });
  // pairwise high-D similarities (cosine)
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
  const n = X.length;
  const sims: number[][] = X.map((a) => X.map((b) => {
    const na = Math.sqrt(dot(a, a)) || 1; const nb = Math.sqrt(dot(b, b)) || 1;
    return dot(a, b) / (na * nb);
  }));
  const lr = 0.05;
  for (let it = 0; it < iters; it++) {
    const grads = pts.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d2 = dx * dx + dy * dy + 1e-6;
      const q = 1 / (1 + d2);
      const f = (sims[i][j] - q) * q;
      grads[i].x += f * dx; grads[i].y += f * dy;
    }
    grads.forEach((g, i) => { pts[i].x += lr * g.x; pts[i].y += lr * g.y; });
  }
  return pts;
}

// Simulated training curve (LSTM/BiLSTM-style) — for visualization
export function simulateTrainingCurve(epochs = 20, seed = 1) {
  const out: { epoch: number; lstm_loss: number; bilstm_loss: number; lstm_acc: number; bilstm_acc: number }[] = [];
  let r = seed;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let e = 1; e <= epochs; e++) {
    const base = Math.exp(-e / 6);
    out.push({
      epoch: e,
      lstm_loss: +(base * (1.6 + rnd() * 0.1) + 0.15).toFixed(3),
      bilstm_loss: +(base * (1.4 + rnd() * 0.1) + 0.1).toFixed(3),
      lstm_acc: +(1 - base * (0.7 + rnd() * 0.05)).toFixed(3),
      bilstm_acc: +(1 - base * (0.55 + rnd() * 0.05)).toFixed(3),
    });
  }
  return out;
}

export function confusionMatrix(labels: string[], preds: string[]): { classes: string[]; matrix: number[][] } {
  const classes = [...new Set([...labels, ...preds])].sort();
  const idx = new Map(classes.map((c, i) => [c, i]));
  const matrix = classes.map(() => new Array(classes.length).fill(0));
  labels.forEach((l, i) => {
    const a = idx.get(l)!, b = idx.get(preds[i])!;
    matrix[a][b]++;
  });
  return { classes, matrix };
}

export function quantiles(values: number[]) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
  return { min: s[0], q1: q(0.25), median: q(0.5), q3: q(0.75), max: s[s.length - 1] };
}
