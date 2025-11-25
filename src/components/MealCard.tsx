import { Meal } from '../types/meal';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-xl"
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={meal.strMealThumb}
          alt={meal.strMeal}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{meal.strMeal}</h3>
        <div className="flex gap-2 text-sm text-gray-600">
          {meal.strCategory && (
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md">
              {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              {meal.strArea}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
