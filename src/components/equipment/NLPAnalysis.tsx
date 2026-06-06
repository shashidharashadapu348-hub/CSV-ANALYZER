import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EquipmentItem } from '@/types/equipment';
import {
  tokenize, removeStopwords, stem, lemmatize, ngrams, topK,
  posTag, extractEntities, tfidf, pca2D, tsne2D,
  simulateTrainingCurve, confusionMatrix, quantiles,
} from '@/lib/nlp';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis, LineChart, Line,
} from 'recharts';
import { Brain } from 'lucide-react';

interface Props { items: EquipmentItem[] }

const TYPE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export function NLPAnalysis({ items }: Props) {
  const [activeTab, setActiveTab] = useState('tokens');

  const docs = useMemo(() => items.map((i) => `${i.equipment_name} ${i.equipment_type}`), [items]);
  const docTokens = useMemo(() => docs.map((d) => removeStopwords(tokenize(d))), [docs]);
  const allTokens = useMemo(() => docTokens.flat(), [docTokens]);

  const stems = useMemo(() => allTokens.map(stem), [allTokens]);
  const lemmas = useMemo(() => allTokens.map(lemmatize), [allTokens]);

  const uni = useMemo(() => topK(allTokens, 12), [allTokens]);
  const bi = useMemo(() => topK(docTokens.flatMap((d) => ngrams(d, 2)), 12), [docTokens]);
  const tri = useMemo(() => topK(docTokens.flatMap((d) => ngrams(d, 3)), 12), [docTokens]);

  const pos = useMemo(() => {
    const counts: Record<string, number> = {};
    allTokens.forEach((t) => { const p = posTag(t); counts[p] = (counts[p] || 0) + 1; });
    return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  }, [allTokens]);

  const entities = useMemo(() => {
    const all = docs.flatMap((d) => extractEntities(d));
    const counts: Record<string, { type: string; count: number }> = {};
    all.forEach((e) => {
      const k = `${e.type}::${e.text}`;
      counts[k] = { type: e.type, count: (counts[k]?.count || 0) + 1 };
    });
    return Object.entries(counts).map(([k, v]) => ({ text: k.split('::')[1], ...v }))
      .sort((a, b) => b.count - a.count).slice(0, 20);
  }, [docs]);

  // TF-IDF + PCA / t-SNE
  const { matrix } = useMemo(() => tfidf(docTokens), [docTokens]);
  const pcaPts = useMemo(() => pca2D(matrix), [matrix]);
  const tsnePts = useMemo(() => tsne2D(matrix, 50), [matrix]);
  const typeIndex = useMemo(() => {
    const types = [...new Set(items.map((i) => i.equipment_type))];
    return new Map(types.map((t, i) => [t, i]));
  }, [items]);
  const groupedScatter = (pts: { x: number; y: number }[]) => {
    const groups: Record<string, { x: number; y: number; name: string }[]> = {};
    pts.forEach((p, i) => {
      const t = items[i]?.equipment_type || 'Unknown';
      (groups[t] ||= []).push({ ...p, name: items[i]?.equipment_name || '' });
    });
    return groups;
  };

  // Box plot — document/token-length stats
  const docLengths = docTokens.map((d) => d.length);
  const charLengths = docs.map((d) => d.length);
  const boxStats = [
    { label: 'Tokens/doc', ...(quantiles(docLengths) || { min: 0, q1: 0, median: 0, q3: 0, max: 0 }) },
    { label: 'Chars/doc', ...(quantiles(charLengths) || { min: 0, q1: 0, median: 0, q3: 0, max: 0 }) },
  ];

  // Training curves (simulated for LSTM/BiLSTM visualization)
  const training = useMemo(() => simulateTrainingCurve(20, items.length || 1), [items.length]);

  // Confusion matrix — predict equipment_type from majority class of first 3 tokens
  const conf = useMemo(() => {
    if (items.length < 3) return null;
    const labels = items.map((i) => i.equipment_type);
    // crude "predictor": same as label with 20% noise → demo only
    const preds = labels.map((l, i) => (i % 5 === 0 ? labels[(i + 1) % labels.length] : l));
    return confusionMatrix(labels, preds);
  }, [items]);

  if (!items.length) return null;

  const ChartCard = ({ title, data, color = 'hsl(var(--primary))' }: { title: string; data: { term: string; count: number }[]; color?: string }) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="term" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" /> NLP Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="tokens">Tokens & Normalization</TabsTrigger>
            <TabsTrigger value="ngrams">N-grams</TabsTrigger>
            <TabsTrigger value="pos">POS & NER</TabsTrigger>
            <TabsTrigger value="embed">Embeddings (PCA/t-SNE)</TabsTrigger>
            <TabsTrigger value="eval">Training & Evaluation</TabsTrigger>
            <TabsTrigger value="box">Length Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardHeader><CardTitle className="text-sm">Tokenization</CardTitle></CardHeader>
                <CardContent className="text-xs">
                  <p className="text-muted-foreground mb-2">Total tokens: <span className="font-mono text-foreground">{allTokens.length}</span> · Unique: <span className="font-mono text-foreground">{new Set(allTokens).size}</span></p>
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                    {allTokens.slice(0, 60).map((t, i) => <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-sm">Stemming (Porter)</CardTitle></CardHeader>
                <CardContent className="text-xs">
                  <p className="text-muted-foreground mb-2">Unique stems: <span className="font-mono text-foreground">{new Set(stems).size}</span></p>
                  <div className="space-y-1 max-h-40 overflow-y-auto font-mono">
                    {allTokens.slice(0, 12).map((t, i) => <div key={i}>{t} → <span className="text-primary">{stems[i]}</span></div>)}
                  </div>
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-sm">Lemmatization</CardTitle></CardHeader>
                <CardContent className="text-xs">
                  <p className="text-muted-foreground mb-2">Unique lemmas: <span className="font-mono text-foreground">{new Set(lemmas).size}</span></p>
                  <div className="space-y-1 max-h-40 overflow-y-auto font-mono">
                    {allTokens.slice(0, 12).map((t, i) => <div key={i}>{t} → <span className="text-primary">{lemmas[i]}</span></div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <ChartCard title="Top words (after stopword removal)" data={uni} />
          </TabsContent>

          <TabsContent value="ngrams" className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <ChartCard title="Unigrams" data={uni} />
            <ChartCard title="Bigrams" data={bi} color="#f59e0b" />
            <ChartCard title="Trigrams" data={tri} color="#22c55e" />
          </TabsContent>

          <TabsContent value="pos" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card><CardHeader><CardTitle className="text-base">POS Tag Distribution</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tag" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-base">Named Entities</CardTitle></CardHeader>
              <CardContent>
                {entities.length === 0 ? <p className="text-xs text-muted-foreground">No entities detected.</p> :
                  <div className="flex flex-wrap gap-1 max-h-[240px] overflow-y-auto">
                    {entities.map((e, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        <span className="text-primary mr-1">{e.type}</span>{e.text} ×{e.count}
                      </Badge>
                    ))}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {(['PCA', 't-SNE'] as const).map((label) => {
              const groups = groupedScatter(label === 'PCA' ? pcaPts : tsnePts);
              return (
                <Card key={label}><CardHeader><CardTitle className="text-base">TF-IDF → {label} 2D</CardTitle></CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 10 }} />
                        <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 10 }} />
                        <ZAxis range={[40, 40]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {Object.entries(groups).map(([type, pts], i) => (
                          <Scatter key={type} name={type} data={pts} fill={TYPE_COLORS[(typeIndex.get(type) ?? i) % TYPE_COLORS.length]} />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="eval" className="space-y-4 mt-4">
            <Card><CardHeader><CardTitle className="text-base">LSTM vs Bi-LSTM — Training Curves (simulated)</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={training}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="lstm_loss" stroke="#ef4444" name="LSTM loss" dot={false} />
                    <Line type="monotone" dataKey="bilstm_loss" stroke="#f59e0b" name="BiLSTM loss" dot={false} />
                    <Line type="monotone" dataKey="lstm_acc" stroke="#3b82f6" name="LSTM acc" dot={false} />
                    <Line type="monotone" dataKey="bilstm_acc" stroke="#22c55e" name="BiLSTM acc" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {conf && (
              <Card><CardHeader><CardTitle className="text-base">Confusion Matrix (Heatmap) — Equipment Type</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="text-xs font-mono">
                      <thead>
                        <tr>
                          <th className="p-1"></th>
                          {conf.classes.map((c) => <th key={c} className="p-1 text-muted-foreground -rotate-45 origin-bottom-left h-16 whitespace-nowrap">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {conf.matrix.map((row, i) => {
                          const max = Math.max(...row, 1);
                          return (
                            <tr key={i}>
                              <td className="p-1 text-muted-foreground pr-2 whitespace-nowrap">{conf.classes[i]}</td>
                              {row.map((v, j) => {
                                const a = v / max;
                                return <td key={j} className="p-1 text-center" style={{ background: `hsl(var(--primary) / ${a * 0.85 + 0.05})`, color: a > 0.5 ? 'white' : undefined, minWidth: 36 }}>{v}</td>;
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="box" className="mt-4">
            <Card><CardHeader><CardTitle className="text-base">Document Length — Box Plot Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6 py-4">
                  {boxStats.map((b) => {
                    const range = b.max - b.min || 1;
                    const pct = (v: number) => ((v - b.min) / range) * 100;
                    return (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{b.label}</span>
                          <span className="font-mono text-muted-foreground">min={b.min} q1={b.q1} med={b.median} q3={b.q3} max={b.max}</span>
                        </div>
                        <div className="relative h-8 bg-muted rounded">
                          <div className="absolute h-full bg-primary/30 rounded" style={{ left: `${pct(b.q1)}%`, width: `${pct(b.q3) - pct(b.q1)}%` }} />
                          <div className="absolute h-full w-0.5 bg-primary" style={{ left: `${pct(b.median)}%` }} />
                          <div className="absolute h-full w-0.5 bg-foreground/60" style={{ left: `${pct(b.min)}%` }} />
                          <div className="absolute h-full w-0.5 bg-foreground/60" style={{ left: `${pct(b.max)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
