// src/app/components/WorkoutHistory.tsx

type WorkoutData = {
  id: number;
  workout_date: string;
  workout_exercises: {
    id: number;
    exercise: string;
    sets: {
      id: number;
      reps: number;
      weight: number;
      created_at: string | null;
    }[];
  }[];
};

interface WorkoutHistoryProps {
  allWorkouts: WorkoutData[] | null;
  exerciseName: string;
}

export default function WorkoutHistory({ allWorkouts, exerciseName }: WorkoutHistoryProps) {
  const exerciseSessions = allWorkouts
    ?.map(w => {
      const exercise = w.workout_exercises.find(we => we.exercise === exerciseName);
      if (!exercise || exercise.sets.length === 0) {
        return null;
      }
      return {
        date: new Date(w.workout_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC' // Treat date as UTC to avoid off-by-one day errors
        }),
        sets: exercise.sets,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!exerciseSessions || exerciseSessions.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-center text-white mb-4">Workout History</h2>
        <p className="text-center text-gray-500 py-4">No past workouts found for {exerciseName}.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-center text-white mb-4">Workout History</h2>
      <div className="space-y-6">
        {exerciseSessions.map((session, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-white mb-2">{session.date}</h3>
            <div className="space-y-1 text-gray-300">
              {session.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex justify-between">
                  <span>{set.reps} reps @ {set.weight} lbs</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 