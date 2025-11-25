import { Meal, Category, ApiResponse } from '../types/meal';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meal-api`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export const mealApi = {
  async searchMeals(query: string): Promise<ApiResponse<Meal>> {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { headers });
    if (!response.ok) throw new Error('Failed to search meals');
    return response.json();
  },

  async getCategories(): Promise<ApiResponse<never>> {
    const response = await fetch(`${API_BASE}/categories`, { headers });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getMealsByCategory(category: string): Promise<ApiResponse<Meal>> {
    const response = await fetch(`${API_BASE}/category?name=${encodeURIComponent(category)}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch meals by category');
    return response.json();
  },

  async getRandomMeal(): Promise<ApiResponse<Meal>> {
    const response = await fetch(`${API_BASE}/random`, { headers });
    if (!response.ok) throw new Error('Failed to fetch random meal');
    return response.json();
  },

  async getMealDetail(id: string): Promise<ApiResponse<Meal>> {
    const response = await fetch(`${API_BASE}/detail?id=${encodeURIComponent(id)}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch meal details');
    return response.json();
  },
};
