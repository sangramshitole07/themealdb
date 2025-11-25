import { Category } from '../types/meal';

interface CategoryBrowserProps {
  categories: Category[];
  onSelectCategory: (category: string) => void;
  isLoading?: boolean;
}

export function CategoryBrowser({ categories, onSelectCategory, isLoading }: CategoryBrowserProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.idCategory}
            onClick={() => onSelectCategory(category.strCategory)}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105 hover:shadow-xl text-left"
          >
            <div className="aspect-video relative overflow-hidden bg-gray-100">
              <img
                src={category.strCategoryThumb}
                alt={category.strCategory}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{category.strCategory}</h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
