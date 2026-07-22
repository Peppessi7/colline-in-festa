import { useState, useMemo } from "react";
import { menuSummary } from "@/lib/festival-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search, Leaf } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  antipasto: "bg-amber-400",
  primo:     "bg-red-500",
  secondo:   "bg-blue-600",
  dolce:     "bg-pink-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  antipasto: "Antipasto",
  primo:     "Primo",
  secondo:   "Secondo",
  dolce:     "Dolce",
};

const FILTER_OPTIONS = [
  { value: "all",       label: "Tutti" },
  { value: "antipasto", label: "Antipasti" },
  { value: "primo",     label: "Primi" },
  { value: "secondo",   label: "Secondi" },
  { value: "dolce",     label: "Dolci" },
];

type DishEntry = {
  id: number;
  name: string;
  category: string;
  tag?: string | null;
  price: number;
  description?: string | null;
};

export default function MenuPage() {
  const summary = menuSummary;

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [onlyVegetariano, setOnlyVegetariano] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const query = search.trim().toLowerCase();

  const allPrices = useMemo(() => {
    return summary.stands.flatMap(e => [
      ...e.antipasti, ...e.primi, ...e.secondi, ...e.dolci,
    ]).map(d => d.price);
  }, [summary]);

  const globalMax = useMemo(() => Math.ceil(Math.max(0, ...allPrices)), [allPrices]);
  const sliderMax = maxPrice ?? globalMax;

  const filteredStands = useMemo(() => {
    return summary.stands
      .map((entry, idx) => {
        const allDishes: DishEntry[] = [
          ...entry.antipasti.map(d => ({ ...d, category: "antipasto" })),
          ...entry.primi.map(d => ({ ...d, category: "primo" })),
          ...entry.secondi.map(d => ({ ...d, category: "secondo" })),

          ...entry.dolci.map(d => ({ ...d, category: "dolce" })),
        ];

        const filtered = allDishes.filter(dish => {
          const matchesCategory = activeFilter === "all" || dish.category === activeFilter;
          const matchesSearch = query === "" || dish.name.toLowerCase().includes(query);
          const matchesPrice = dish.price <= sliderMax;
          const matchesVegetariano = !onlyVegetariano || dish.tag === "vegetariano";
          return matchesCategory && matchesSearch && matchesPrice && matchesVegetariano;
        });

        return { entry, standNumber: idx + 1, filtered };
      })
      .filter(({ filtered }) => filtered.length > 0);
  }, [summary, activeFilter, query, sliderMax, onlyVegetariano]);

  if (summary.stands.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-3xl font-serif text-foreground">Nessuno stand disponibile</h2>
        <p className="text-muted-foreground text-lg">I dati del menù statico non sono ancora stati importati.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center space-y-2 md:space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-serif text-primary">Menù</h1>
        <div className="flex items-center justify-center gap-3 text-sm font-medium">
          <Badge variant="outline" className="bg-secondary/15 text-secondary border-secondary/30 px-3 py-1">
            {summary.totalStands} Stand
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            {summary.totalDishes} Piatti
          </Badge>
        </div>
      </div>
      {/* Search + filter bar */}
      <div className="space-y-2 md:space-y-3 max-w-3xl mx-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Cerca un piatto..."
            className="pl-9 h-11"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filters — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              type="button"
              variant={activeFilter === opt.value ? "default" : "outline"}
              size="sm"
              className="text-xs px-3 shrink-0 h-9"
              onClick={() => setActiveFilter(opt.value)}
            >
              {opt.value !== "all" && (
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${CATEGORY_COLORS[opt.value]}`} />
              )}
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Vegetariano filter */}
        <div>
          <Button
            type="button"
            variant={onlyVegetariano ? "default" : "outline"}
            size="sm"
            className={`text-xs px-3 shrink-0 h-9 ${onlyVegetariano ? "bg-green-600 hover:bg-green-700 border-green-600" : "border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"}`}
            onClick={() => setOnlyVegetariano(v => !v)}
          >
            <Leaf className="h-3 w-3 mr-1.5" />
            Vegetariano
          </Button>
        </div>

        {/* Price slider */}
        {globalMax > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">Prezzo</span>
            <Slider
              min={0}
              max={globalMax}
              step={0.5}
              value={[sliderMax]}
              onValueChange={(values) => {
                const value = values[0];
                if (value !== undefined) setMaxPrice(value === globalMax ? null : value);
              }}
              className="flex-1"
            />
            <span className="text-sm font-bold text-primary whitespace-nowrap w-14 text-right shrink-0">
              {`€${sliderMax.toFixed(2)}`}
            </span>
            {maxPrice !== null && (
              <button
                type="button"
                onClick={() => setMaxPrice(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>
      {/* No results */}
      {filteredStands.length === 0 && (
        <div className="text-center py-16 space-y-2 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-lg font-medium">Nessun piatto trovato</p>
          <p className="text-sm">Prova a modificare la ricerca o il filtro.</p>
        </div>
      )}
      {/* Stands */}
      <div className="space-y-6">
        {filteredStands.map(({ entry, standNumber, filtered }) => (
          <Card key={entry.stand.id} className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/40 py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full shadow-sm shrink-0 flex items-center justify-center font-bold text-sm">
                  {standNumber}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <CardTitle className="text-xl font-serif font-bold">{entry.stand.name}</CardTitle>
                    {entry.stand.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{entry.stand.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/40">
                {filtered.map((dish) => (
                  <li
                    key={dish.id}
                    data-testid={`dish-row-${dish.id}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[dish.category] ?? "bg-muted"}`}
                      title={CATEGORY_LABELS[dish.category]}
                    />
                    <span className="flex-1 font-medium text-foreground leading-tight">{dish.name}</span>
                    <span className="font-bold text-primary shrink-0">€{dish.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
