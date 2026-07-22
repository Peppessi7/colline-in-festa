import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { dishes } from "@/lib/festival-data";
import type { PlannerResponse } from "@/lib/festival-data";
import { suggestMeal } from "@/lib/planner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Search, AlertCircle, Utensils, ChevronDown, X, TrendingDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CATEGORY_LABELS: Record<string, string> = {
  antipasto: "Antipasto",
  primo:     "Primo",
  secondo:   "Secondo",
  dolce:     "Dolce",
};

const CATEGORY_COLORS: Record<string, string> = {
  antipasto: "bg-amber-400",
  primo:     "bg-red-500",
  secondo:   "bg-blue-600",
  dolce:     "bg-pink-400",
};

const formSchema = z.object({
  budget: z.preprocess(
    (v) => {
      if (typeof v === "string") return parseFloat(v.replace(",", "."));
      return v;
    },
    z.number({ invalid_type_error: "Inserisci un importo valido" }).min(0.01, "Il budget deve essere maggiore di 0")
  ),
  antipastiCount: z.coerce.number().min(0).max(10),
  primiCount:     z.coerce.number().min(0).max(10),
  secondiCount:   z.coerce.number().min(0).max(10),
  dolciCount:     z.coerce.number().min(0).max(10),
  excludedDishIds: z.array(z.number()).default([]),
  requiredDishIds: z.array(z.number()).default([]),
  cheapestOnly: z.boolean().default(false),
  vegetariano: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// ── CounterInput ─────────────────────────────────────────────────────────────
function CounterInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card min-h-[48px]">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon"
          className="h-11 w-11 rounded-full shrink-0"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-7 text-center font-bold text-base tabular-nums">{value}</span>
        <Button type="button" variant="outline" size="icon"
          className="h-11 w-11 rounded-full shrink-0 border-primary/40 text-primary"
          onClick={() => onChange(value + 1)}
          disabled={value >= 10}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── DishMultiSelect ───────────────────────────────────────────────────────────
type DishOption = { id: number; name: string; category: string; standName: string; price: number };

function DishMultiSelect({
  label,
  dishes,
  selected,
  disabledIds,
  onChange,
  colorClass,
}: {
  label: string;
  dishes: DishOption[];
  selected: number[];
  disabledIds: number[];
  onChange: (ids: number[]) => void;
  colorClass: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const grouped = dishes.reduce<Record<string, DishOption[]>>((groups, dish) => {
    (groups[dish.category] ??= []).push(dish);
    return groups;
  }, {});
  const categoryOrder = ["antipasto", "primo", "secondo", "contorno", "dolce"];

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={`multiselect-${label}`}
            className="w-full flex items-center justify-between px-3 py-3 min-h-[44px] rounded-lg border border-border bg-card text-sm text-left hover:bg-muted/40 transition-colors"
          >
            <span className="text-muted-foreground">
              {selected.length === 0 ? "Nessuno selezionato" : `${selected.length} piatto${selected.length > 1 ? "i" : ""} selezionato${selected.length > 1 ? "i" : ""}`}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 max-h-72 overflow-y-auto" align="start">
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 sticky top-0">
                  <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
                {items.map((dish) => {
                  const isDisabled = disabledIds.includes(dish.id);
                  const isChecked = selected.includes(dish.id);
                  return (
                    <label
                      key={dish.id}
                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && toggle(dish.id)}
                        className={colorClass}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{dish.name}</div>
                        <div className="text-xs text-muted-foreground">{dish.standName} · €{dish.price.toFixed(2)}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
          {dishes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nessun piatto disponibile</p>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {selected.map((id) => {
            const dish = dishes.find((d) => d.id === id);
            if (!dish) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                {dish.name}
                <button type="button" onClick={() => toggle(id)} className="hover:text-destructive transition-colors">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PlannerPage ───────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [result, setResult] = useState<PlannerResponse | null>(null);
  const [budgetDisplay, setBudgetDisplay] = useState("20");
  const [lastWasCheapest, setLastWasCheapest] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget: 20,
      antipastiCount: 1,
      primiCount: 1,
      secondiCount: 1,
      dolciCount: 1,
      excludedDishIds: [],
      requiredDishIds: [],
      cheapestOnly: false,
      vegetariano: false,
    },
  });

  const excludedIds = form.watch("excludedDishIds");
  const requiredIds = form.watch("requiredDishIds");

  const dishList: DishOption[] = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    standName: d.standName,
    price: d.price,
  }));

  const onSubmit = (values: FormValues) => {
    setLastWasCheapest(values.cheapestOnly ?? false);
    setResult(suggestMeal(dishes, values));
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero title */}
      <div className="text-center space-y-2 md:space-y-4 pt-2 pb-2 md:py-6">
        <h1 className="text-3xl md:text-7xl font-serif font-bold text-primary leading-tight">
          Cosa mangiamo stasera?
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
          Tu scegli budget e portate, io ti suggerisco la combinazione perfetta.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        {/* Form card */}
        <div className="md:col-span-5 lg:col-span-4 space-y-4">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
              <CardTitle className="text-xl">Il tuo piano</CardTitle>
              <CardDescription>Configura le tue preferenze</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  {/* Budget */}
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Budget (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none">€</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="pl-8 text-lg font-bold h-11"
                              data-testid="input-budget"
                              value={budgetDisplay}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setBudgetDisplay(raw);
                                const parsed = parseFloat(raw.replace(",", "."));
                                field.onChange(isNaN(parsed) ? "" : parsed);
                              }}
                              onBlur={() => {
                                const parsed = parseFloat(budgetDisplay.replace(",", "."));
                                if (!isNaN(parsed)) setBudgetDisplay(String(parsed).replace(".", ","));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Non include coperti e bevande.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Course counts */}
                  <div className="space-y-2">
                    <Label className="text-base block">Composizione del menù</Label>
                    {(["antipastiCount", "primiCount", "secondiCount", "dolciCount"] as const).map((name) => {
                      const labelMap = { antipastiCount: "Antipasti", primiCount: "Primi", secondiCount: "Secondi", dolciCount: "Dolci" };
                      return (
                        <FormField key={name} control={form.control} name={name}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CounterInput label={labelMap[name]} value={field.value} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Dish preferences */}
                  <div className="space-y-3 pt-1">
                    <Label className="text-base block">Preferenze piatti</Label>

                  {/* Vegetariano toggle */}
                  <FormField
                    control={form.control}
                    name="vegetariano"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 px-4 py-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold cursor-pointer flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                              Solo vegetariano
                            </FormLabel>
                            <p className="text-xs text-muted-foreground leading-tight">
                              Considera solo i piatti vegetariani
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                    <>
                        <FormField
                          control={form.control}
                          name="requiredDishIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <DishMultiSelect
                                  label="Piatti obbligatori"
                                  dishes={dishList}
                                  selected={field.value}
                                  disabledIds={excludedIds}
                                  onChange={field.onChange}
                                  colorClass="border-secondary data-[state=checked]:bg-secondary"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="excludedDishIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <DishMultiSelect
                                  label="Piatti da escludere"
                                  dishes={dishList}
                                  selected={field.value}
                                  disabledIds={requiredIds}
                                  onChange={field.onChange}
                                  colorClass="border-destructive data-[state=checked]:bg-destructive"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                    </>
                  </div>

                  {/* Cheapest-only toggle */}
                  <FormField
                    control={form.control}
                    name="cheapestOnly"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold cursor-pointer">
                              Menù più economico
                            </FormLabel>
                            <p className="text-xs text-muted-foreground leading-tight">
                              Mostra sempre la combinazione al costo minimo
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg font-bold"
                    data-testid="button-submit"
                  >
                    <Search className="mr-2 h-5 w-5" /> Suggerisci Menù
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Result panel */}
        <div className="md:col-span-7 lg:col-span-8">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
              {!result.success ? (
                <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-lg font-bold ml-2">Impossibile creare il menù</AlertTitle>
                  <AlertDescription className="text-base ml-2 mt-1">{result.message}</AlertDescription>
                </Alert>
              ) : (
                <Card className="border-secondary/30 shadow-lg overflow-hidden">
                  <CardHeader className="bg-card border-b border-border pb-5">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-2xl font-serif text-primary">Il tuo Menù Ideale</CardTitle>
                          {lastWasCheapest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/20 text-secondary border border-secondary/30">
                              <TrendingDown className="h-3 w-3" /> Più economico
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-sm mt-1">{result.message}</CardDescription>
                      </div>
                      <div className="bg-primary/10 px-4 py-3 rounded-lg border border-primary/20 text-center shrink-0">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Totale</div>
                        <div className="text-3xl font-bold text-primary">€{result.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {[...result.dishes].sort((a, b) => {
                        const order = ["antipasto", "primo", "secondo", "contorno", "dolce"];
                        return (order.indexOf(a.category) ?? 99) - (order.indexOf(b.category) ?? 99);
                      }).map((planned, i) => (
                        <li key={`${planned.dish.id}-${i}`}
                          className="px-5 py-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[planned.category] ?? "bg-muted"}`} />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {CATEGORY_LABELS[planned.category] ?? planned.category}
                              </span>
                              <span className="text-xs text-muted-foreground">· {planned.dish.standName}</span>
                            </div>
                            <h4 className="text-lg font-bold text-foreground">{planned.dish.name}</h4>
                            {planned.dish.description && (
                              <p className="text-muted-foreground text-sm line-clamp-1">{planned.dish.description}</p>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-primary sm:text-right shrink-0">
                            €{planned.dish.price.toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="bg-muted/20 border-t border-border py-3 px-5 flex justify-between items-center text-sm text-muted-foreground">
                    <span>Budget: €{Number(form.getValues().budget).toFixed(2)}</span>
                    <span>Rimane: €{(result.remainingBudget ?? 0).toFixed(2)}</span>
                  </CardFooter>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[160px] md:min-h-[400px] flex flex-col items-center justify-center space-y-3 text-muted-foreground border-2 border-dashed border-border rounded-xl p-6 md:p-8 bg-card/50">
              <Utensils className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30" />
              <div className="text-center space-y-1">
                <p className="text-base md:text-xl font-medium text-foreground/70">Nessun menù suggerito</p>
                <p className="text-xs md:text-sm">Configura le preferenze e tocca "Suggerisci Menù".</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
