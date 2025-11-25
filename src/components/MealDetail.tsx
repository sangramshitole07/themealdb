import { X, Youtube } from 'lucide-react';
import { Meal } from '../types/meal';

interface MealDetailProps {
  meal: Meal;
  onClose: () => void;
}

export function MealDetail({ meal, onClose }: MealDetailProps) {
  const ingredients: Array<{ ingredient: string; measure: string }> = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof Meal];
    const measure = meal[`strMeasure${i}` as keyof Meal];

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient as string,
        measure: measure as string || '',
      });
    }
  }

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const videoId = url.split('v=')[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getYoutubeEmbedUrl(meal.strYoutube);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8 flex items-start justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="aspect-video w-full relative overflow-hidden rounded-t-2xl bg-gray-100">
            <img
              src={meal.strMealThumb}
              alt={meal.strMeal}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">{meal.strMeal}</h1>

            <div className="flex gap-3 mb-6">
              {meal.strCategory && (
                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium">
                  {meal.strCategory}
                </span>
              )}
              {meal.strArea && (
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium">
                  {meal.strArea}
                </span>
              )}
              {meal.strTags && meal.strTags.split(',').slice(0, 2).map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ingredients.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-900">{item.ingredient}</span>
                    <span className="text-gray-600">{item.measure}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Instructions</h2>
              <div className="prose max-w-none">
                {meal.strInstructions?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>

            {embedUrl && (
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Youtube className="text-red-600" size={28} />
                  Video Tutorial
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Recipe video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
