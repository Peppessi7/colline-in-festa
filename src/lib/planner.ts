import type {
  Dish,
  DishCategory,
  PlannerRequest,
  PlannerResponse,
} from "@/lib/festival-data";

const categories: DishCategory[] = ["antipasto", "primo", "secondo", "dolce"];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index]!;
    result[index] = result[randomIndex]!;
    result[randomIndex] = current;
  }
  return result;
}

function pickDishes(
  pool: Dish[],
  count: number,
  categoryBudget: number,
  required: Dish[],
): Dish[] | null {
  const needed = count - required.length;
  if (needed < 0) return null;

  const uniquePool = [...new Map(pool.map((dish) => [dish.id, dish])).values()];
  const available = uniquePool.filter(
    (dish) => !required.some((requiredDish) => requiredDish.id === dish.id),
  );
  if (available.length < needed) return null;

  const requiredCost = required.reduce((total, dish) => total + dish.price, 0);
  const availableBudget = categoryBudget - requiredCost;
  const baseline = [...available].sort((a, b) => a.price - b.price).slice(0, needed);
  let pickedCost = baseline.reduce((total, dish) => total + dish.price, 0);

  if (pickedCost > availableBudget) return null;
  if (needed === 0) return [...required];

  const picked = [...baseline];
  for (let round = 0; round < 30; round += 1) {
    const index = Math.floor(Math.random() * picked.length);
    const current = picked[index];
    if (!current) continue;
    const headroom = availableBudget - pickedCost + current.price;
    const pickedIds = new Set(picked.map((dish) => dish.id));
    const alternatives = available.filter(
      (dish) => !pickedIds.has(dish.id) && dish.price <= headroom,
    );
    if (alternatives.length === 0) continue;

    const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
    if (!replacement) continue;
    pickedCost = pickedCost - current.price + replacement.price;
    picked[index] = replacement;
  }

  return [...required, ...picked];
}

export function suggestMeal(allDishes: Dish[], request: PlannerRequest): PlannerResponse {
  const {
    budget,
    antipastiCount,
    primiCount,
    secondiCount,
    dolciCount,
    excludedDishIds = [],
    requiredDishIds = [],
    cheapestOnly = false,
    vegetariano = false,
  } = request;

  const fail = (message: string, totalCost = 0): PlannerResponse => ({
    success: false,
    totalCost,
    remainingBudget: budget - totalCost,
    dishes: [],
    message,
  });

  if (allDishes.length === 0) {
    return fail("I dati del menù non sono ancora stati importati nel file statico.");
  }

  const availableDishes = allDishes.filter(
    (dish) =>
      !excludedDishIds.includes(dish.id) &&
      (!vegetariano || dish.tag === "vegetariano"),
  );
  const requiredDishes = requiredDishIds
    .map((id) => availableDishes.find((dish) => dish.id === id))
    .filter((dish): dish is Dish => dish !== undefined);

  const requiredByCategory = Object.fromEntries(
    categories.map((category) => [category, [] as Dish[]]),
  ) as Record<DishCategory, Dish[]>;
  requiredDishes.forEach((dish) => requiredByCategory[dish.category].push(dish));

  const counts: Record<DishCategory, number> = {
    antipasto: antipastiCount,
    primo: primiCount,
    secondo: secondiCount,
    dolce: dolciCount,
  };

  for (const category of categories) {
    if (requiredByCategory[category].length > counts[category]) {
      return fail(
        `Hai selezionato più piatti obbligatori di tipo "${category}" rispetto al numero richiesto.`,
      );
    }
  }

  let minimumTotal = 0;
  const minimumByCategory = {} as Record<DishCategory, number>;
  const poolByCategory = {} as Record<DishCategory, Dish[]>;

  for (const category of categories) {
    const count = counts[category];
    const pool = [...new Map(
      availableDishes
        .filter((dish) => dish.category === category)
        .map((dish) => [dish.id, dish]),
    ).values()];
    poolByCategory[category] = pool;

    if (count === 0) {
      minimumByCategory[category] = 0;
      continue;
    }
    if (pool.length < count) {
      return fail(
        `Non ci sono abbastanza piatti di tipo "${category}" nel menù (ne servono ${count}, ce ne sono ${pool.length}).`,
      );
    }

    const required = requiredByCategory[category];
    const remaining = pool.filter(
      (dish) => !required.some((requiredDish) => requiredDish.id === dish.id),
    );
    const cheapest = [...remaining]
      .sort((a, b) => a.price - b.price)
      .slice(0, count - required.length);
    const categoryMinimum = [...required, ...cheapest].reduce(
      (total, dish) => total + dish.price,
      0,
    );
    minimumByCategory[category] = categoryMinimum;
    minimumTotal += categoryMinimum;
  }

  if (budget < minimumTotal) {
    return fail(
      `Budget insufficiente. Per questo menù servono almeno €${minimumTotal.toFixed(2)} (il tuo budget è €${budget.toFixed(2)}).`,
      minimumTotal,
    );
  }

  const selected: Dish[] = [];
  let totalCost = 0;
  let remainingSlack = budget - minimumTotal;

  for (const category of cheapestOnly ? categories : shuffle(categories)) {
    const count = counts[category];
    if (count === 0) continue;

    const required = requiredByCategory[category];
    const pool = poolByCategory[category];
    let picked: Dish[] | null;

    if (cheapestOnly) {
      const available = pool.filter(
        (dish) => !required.some((requiredDish) => requiredDish.id === dish.id),
      );
      picked = [
        ...required,
        ...available.sort((a, b) => a.price - b.price).slice(0, count - required.length),
      ];
    } else {
      picked = pickDishes(
        pool,
        count,
        minimumByCategory[category] + remainingSlack,
        required,
      );
    }

    if (!picked || picked.length < count) {
      return fail(`Errore nella selezione dei piatti di tipo "${category}". Riprova.`);
    }

    const categoryCost = picked.reduce((total, dish) => total + dish.price, 0);
    remainingSlack -= categoryCost - minimumByCategory[category];
    totalCost += categoryCost;
    selected.push(...picked);
  }

  const remainingBudget = budget - totalCost;
  return {
    success: true,
    totalCost,
    remainingBudget,
    dishes: selected.map((dish) => ({ dish, category: dish.category })),
    message: cheapestOnly
      ? `Menù più economico trovato! Costo minimo: €${totalCost.toFixed(2)} (avanzano €${remainingBudget.toFixed(2)}).`
      : `Combinazione trovata! Hai speso €${totalCost.toFixed(2)} su €${budget.toFixed(2)} di budget (avanzano €${remainingBudget.toFixed(2)}).`,
  };
}
