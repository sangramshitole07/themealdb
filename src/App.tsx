import { useState, useEffect } from 'react';
import { ChefHat, Dices } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { MealCard } from './components/MealCard';
import { CategoryBrowser } from './components/CategoryBrowser';
import { MealDetail } from './components/MealDetail';
import { mealApi } from './services/mealApi';
import { Meal, Category } from './types/meal';

type View = 'home' | 'search' | 'category';

function App() {
  const [view, setView] = useState<View>('home');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await mealApi.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await mealApi.searchMeals(query);
      setMeals(response.meals || []);
      setView('search');
      setCurrentTitle(`Search results for "${query}"`);
      setIsCached(response.cached || false);
    } catch (error) {
      console.error('Search failed:', error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    try {
      setIsLoading(true);
      const response = await mealApi.getMealsByCategory(category);
      setMeals(response.meals || []);
      setView('category');
      setCurrentTitle(category);
      setIsCached(response.cached || false);
    } catch (error) {
      console.error('Failed to load category:', error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomMeal = async () => {
    try {
      setIsLoading(true);
      const response = await mealApi.getRandomMeal();
      if (response.meals && response.meals.length > 0) {
        const mealId = response.meals[0].idMeal;
        const detailResponse = await mealApi.getMealDetail(mealId);
        if (detailResponse.meals && detailResponse.meals.length > 0) {
          setSelectedMeal(detailResponse.meals[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load random meal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealClick = async (meal: Meal) => {
    try {
      setIsLoading(true);
      const response = await mealApi.getMealDetail(meal.idMeal);
      if (response.meals && response.meals.length > 0) {
        setSelectedMeal(response.meals[0]);
      }
    } catch (error) {
      console.error('Failed to load meal details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    setView('home');
    setMeals([]);
    setCurrentTitle('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors"
            >
              <ChefHat className="text-orange-500" size={32} />
              TheMealDB Explorer
            </button>
            <button
              onClick={handleRandomMeal}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Dices size={20} />
              I'm Feeling Hungry
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'home' && (
          <div className="space-y-12">
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Discover Amazing Recipes
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Search thousands of recipes from around the world
              </p>
              <div className="flex justify-center">
                <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              </div>
            </div>

            <CategoryBrowser
              categories={categories}
              onSelectCategory={handleCategorySelect}
              isLoading={isLoading}
            />
          </div>
        )}

        {(view === 'search' || view === 'category') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={handleBackToHome}
                  className="text-orange-600 hover:text-orange-700 font-medium mb-2 inline-block"
                >
                  ← Back to Home
                </button>
                <h2 className="text-3xl font-bold text-gray-900">{currentTitle}</h2>
                {isCached && (
                  <p className="text-sm text-green-600 mt-1">
                    ⚡ Cached result (faster response)
                  </p>
                )}
              </div>
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
              </div>
            ) : meals.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-600">No meals found. Try a different search!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {meals.map((meal) => (
                  <MealCard
                    key={meal.idMeal}
                    meal={meal}
                    onClick={() => handleMealClick(meal)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedMeal && (
        <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
      )}
    </div>
  );
}

export default App;
