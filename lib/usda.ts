interface USDANutrient {
  nutrientId: number
  value: number
}

interface USDAFood {
  foodNutrients: USDANutrient[]
}

interface USDASearchResponse {
  foods: USDAFood[]
}

const NUTRIENT_ENERGY = 1008
const NUTRIENT_PROTEIN = 1003

export async function lookupNutritionUSDA(
  foodName: string
): Promise<{ calories: number; protein: number } | null> {
  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) return null

  try {
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
    url.searchParams.set('query', foodName)
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('pageSize', '1')
    url.searchParams.set('dataType', 'Foundation,SR Legacy')

    const res = await fetch(url.toString())
    if (!res.ok) return null

    const data: USDASearchResponse = await res.json()
    const food = data.foods?.[0]
    if (!food) return null

    const nutrients = food.foodNutrients
    const energy = nutrients.find(n => n.nutrientId === NUTRIENT_ENERGY)?.value ?? 0
    const protein = nutrients.find(n => n.nutrientId === NUTRIENT_PROTEIN)?.value ?? 0

    return { calories: energy, protein }
  } catch {
    return null
  }
}
