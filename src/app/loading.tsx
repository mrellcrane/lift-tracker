export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  const lifts = ["Chest Press", "Leg Press", "Lat Pulldown"];

  return (
    <div className="container mx-auto p-4 animate-pulse">
      <h1 className="text-2xl font-bold mb-4 h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></h1>
      <p className="mb-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></p>
      <h2 className="text-xl font-semibold mb-4 h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lifts.map((lift) => (
          <div key={lift} className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 