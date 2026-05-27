import { lookupNutritionUSDA } from '@/lib/usda'

interface ApiNinjasItem {
  name: string
  serving_size_g: number | null
  calories: unknown
  protein_g: unknown
  carbohydrates_total_g: number | null
  fat_total_g: number | null
  sugar_g: number | null
  fiber_g: number | null
}

export interface ParsedFoodItem {
  food_name: string
  serving_qty: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  fiber: number
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function isMissing(v: unknown): boolean {
  return v === null || v === undefined || isNaN(Number(v as string))
}

async function queryApiNinjas(query: string, apiKey: string): Promise<ApiNinjasItem[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  let res: Response
  try {
    res = await fetch(
      `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': apiKey }, signal: controller.signal }
    )
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error(`API-Ninjas error: ${res.status}`)
  return res.json()
}

function toFoodItem(item: ApiNinjasItem, usda: { calories: number; protein: number } | null): ParsedFoodItem {
  const servingG = Number(item.serving_size_g) || 100
  const carbs = round1(Number(item.carbohydrates_total_g) || 0)
  const fat = round1(Number(item.fat_total_g) || 0)

  const protein = !isMissing(item.protein_g)
    ? round1(Number(item.protein_g))
    : usda
      ? round1(usda.protein * (servingG / 100))
      : 0

  const apiCalories = !isMissing(item.calories) ? Math.round(Number(item.calories as string)) : 0
  const usdaCalories = usda ? Math.round(usda.calories * (servingG / 100)) : 0
  const atwater = Math.round(protein * 4 + carbs * 4 + fat * 9)
  const calories = apiCalories > 0 ? apiCalories : usdaCalories > 0 ? usdaCalories : atwater

  return {
    food_name: item.name,
    serving_qty: servingG,
    serving_unit: 'g',
    calories,
    protein,
    carbs,
    fat,
    sugar: round1(Number(item.sugar_g) || 0),
    fiber: round1(Number(item.fiber_g) || 0),
  }
}

export async function parseMeal(text: string): Promise<ParsedFoodItem[]> {
  const apiKey = process.env.CALORIE_NINJAS_KEY
  if (!apiKey) throw new Error('CALORIE_NINJAS_KEY not set')

  // API-Ninjas doesn't handle comma-separated lists — query each food separately in parallel
  const foodTerms = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)

  const rawItemsPerTerm = await Promise.all(
    foodTerms.map(term => queryApiNinjas(term, apiKey))
  )
  const rawItems = rawItemsPerTerm.flat()

  // Parallel USDA lookups for any item missing calories or protein
  const enriched = await Promise.all(
    rawItems.map(item =>
      isMissing(item.calories) || isMissing(item.protein_g)
        ? lookupNutritionUSDA(item.name).then(usda => ({ item, usda }))
        : Promise.resolve({ item, usda: null })
    )
  )

  return enriched.map(({ item, usda }) => toFoodItem(item, usda))
}
