import rawData from "@/data/menu-data.json";

export type DishCategory = "antipasto" | "primo" | "secondo" | "dolce";
export type DishTag = "vegetariano";

export type Stand = {
  id: number;
  name: string;
  description: string | null;
};

export type Dish = {
  id: number;
  standId: number;
  standName: string;
  name: string;
  category: DishCategory;
  tag: DishTag | null;
  price: number;
  description: string | null;
};

export type PlannedDish = {
  dish: Dish;
  category: DishCategory;
};

export type PlannerRequest = {
  budget: number;
  antipastiCount: number;
  primiCount: number;
  secondiCount: number;
  dolciCount: number;
  excludedDishIds?: number[];
  requiredDishIds?: number[];
  cheapestOnly?: boolean;
  vegetariano?: boolean;
};

export type PlannerResponse = {
  success: boolean;
  totalCost: number;
  dishes: PlannedDish[];
  message: string;
  remainingBudget: number;
};

export type MenuStandEntry = {
  stand: Stand;
  antipasti: Dish[];
  primi: Dish[];
  secondi: Dish[];
  dolci: Dish[];
};

export type MenuSummary = {
  stands: MenuStandEntry[];
  totalDishes: number;
  totalStands: number;
};

type StaticData = {
  stands: Array<Omit<Stand, "description"> & { description?: string | null }>;
  dishes: Array<
    Omit<Dish, "standName" | "tag" | "description"> & {
      standName?: string;
      tag?: DishTag | null;
      description?: string | null;
    }
  >;
};

const staticData = rawData as StaticData;

export const stands: Stand[] = staticData.stands.map((stand) => ({
  ...stand,
  description: stand.description ?? null,
}));

const standNames = new Map(stands.map((stand) => [stand.id, stand.name]));

export const dishes: Dish[] = staticData.dishes.map((dish) => ({
  ...dish,
  standName: dish.standName ?? standNames.get(dish.standId) ?? "Stand",
  tag: dish.tag ?? null,
  description: dish.description ?? null,
}));

export const menuSummary: MenuSummary = {
  stands: stands.map((stand) => {
    const standDishes = dishes.filter((dish) => dish.standId === stand.id);

    return {
      stand,
      antipasti: standDishes.filter((dish) => dish.category === "antipasto"),
      primi: standDishes.filter((dish) => dish.category === "primo"),
      secondi: standDishes.filter((dish) => dish.category === "secondo"),
      dolci: standDishes.filter((dish) => dish.category === "dolce"),
    };
  }),
  totalDishes: dishes.length,
  totalStands: stands.length,
};
