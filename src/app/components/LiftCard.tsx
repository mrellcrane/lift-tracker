"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getExerciseSettings,
  updateExerciseSettings,
  getLastWorkoutForExercise,
  createWorkoutExerciseInstance,
  logSet,
  deleteSet,
} from "@/app/actions";
import RestTimer from "./RestTimer";

type SetUI = {
  id?: number;
  reps: string;
  weight: string;
  logged: boolean;
};

// A more flexible type for the exercise data we are passing in
type ExerciseWithSets = {
  id: number;
  exercise: string;
  instance: number;
  sets: {
    id: number;
    reps: number;
    weight: number;
    created_at: string | null;
    set_order: number;
  }[];
};

interface LiftCardProps {
  exerciseName: string;
  todaysWorkoutExercises: ExerciseWithSets[];
  onComplete: () => void;
}

export default function LiftCard({
  exerciseName,
  todaysWorkoutExercises,
  onComplete,
}: LiftCardProps) {
  const [isResting, setIsResting] = useState(false);
  const [sets, setSets] = useState<SetUI[]>([]);
  const [restDuration, setRestDuration] = useState(120);
  const [workoutExerciseId, setWorkoutExerciseId] = useState<number | undefined>();
  const [viewState, setViewState] = useState<'loading' | 'active' | 'summary'>('loading');

  const startNewWorkout = useCallback(async () => {
    // 1. Determine the data for pre-population.
    let lastWorkoutData = null;
    
    // Prioritize workouts from today if they exist.
    if (todaysWorkoutExercises.length > 0) {
      lastWorkoutData = [...todaysWorkoutExercises].sort(
        (a, b) => b.instance - a.instance
      )[0];
    } else {
      // Otherwise, fetch the last workout from a previous day.
      lastWorkoutData = await getLastWorkoutForExercise(exerciseName);
    }

    // 2. Create the new workout instance for the session we are about to start.
    try {
      const newWorkoutExercise = await createWorkoutExerciseInstance(exerciseName);
      setWorkoutExerciseId(newWorkoutExercise.id);
    } catch (error) {
      console.error("Failed to create new workout instance:", error);
      return; // Stop if we can't create a new session
    }
    
    // 3. Prepare the sets for the UI.
    const settings = await getExerciseSettings(exerciseName);
    let initialSets: SetUI[];

    if (lastWorkoutData && lastWorkoutData.sets.length > 0) {
      initialSets = lastWorkoutData.sets
        .sort((a, b) => a.set_order - b.set_order)
        .map((s) => ({
          reps: String(s.reps),
          weight: String(s.weight),
          logged: false,
        }));
    } else {
      initialSets = Array(settings.default_sets)
        .fill(null)
        .map(() => ({ reps: "", weight: "", logged: false }));
    }

    // 4. Update the component state to show the new workout.
    setSets(initialSets);
    setRestDuration(settings.rest_duration_seconds);
    setIsResting(false);
    setViewState('active');
  }, [exerciseName, todaysWorkoutExercises]);

  useEffect(() => {
    if (todaysWorkoutExercises.length > 0) {
      setViewState('summary');
    } else {
      // If no workouts today, prepare a new workout form immediately,
      // which will be pre-populated from the last session on a previous day.
      startNewWorkout();
    }
  }, [exerciseName, todaysWorkoutExercises, startNewWorkout]);

  const handleSetInputChange = (
    index: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const handleAddSet = () => {
    setSets([...sets, { reps: "", weight: "", logged: false }]);
  };

  const handleDeleteSet = async (index: number) => {
    const setToDelete = sets[index];
    if (setToDelete.id && viewState === 'active') { // Only allow delete in active state from DB
        try {
            await deleteSet(setToDelete.id);
        } catch (error) {
            console.error("Failed to delete set from DB:", error);
            return;
        }
    }
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleLogSet = async (index: number) => {
    const set = sets[index];
    const reps = parseInt(set.reps, 10);
    const weight = parseInt(set.weight, 10);

    if (isNaN(reps) || isNaN(weight)) {
      return;
    }

    if (!workoutExerciseId) {
        console.error("Cannot log set without a workout session ID.");
        return;
    }

    try {
      const newSet = await logSet(workoutExerciseId, index, reps, weight);
      
      const newSets = [...sets];
      newSets[index].logged = true;
      newSets[index].id = newSet.id;
      setSets(newSets);
      setIsResting(true);

    } catch (error) {
      console.error("Failed to log set:", error);
    }
  };

  const handleCompleteExercise = () => {
    const loggedSets = sets.filter(s => s.logged);
    if (loggedSets.length === 0) return;

    onComplete();
  };

  const handleTimerEnd = () => {
    setIsResting(false);
  };

  const handleRestTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    if (!isNaN(newDuration) && newDuration > 0) {
        setRestDuration(newDuration);
        updateExerciseSettings(exerciseName, { rest_duration_seconds: newDuration });
    }
  };

  const isBodyweight = exerciseName === "Pull-ups";

  if (viewState === 'loading') {
    return <div className="text-center text-gray-400">Loading workout...</div>;
  }

  if (viewState === 'summary') {
    return (
        <div>
            <h2 className="text-3xl font-bold text-center mb-6 text-white">{exerciseName}</h2>
            
            <button
                onClick={startNewWorkout}
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all"
            >
                Start New Workout
            </button>

            {todaysWorkoutExercises.map((workout) => (
                <div key={workout.id} className="bg-gray-800 p-4 rounded-lg mb-4">
                    <h3 className="text-xl font-bold mb-2 text-white text-center">
                        Today&apos;s Workout #{workout.instance}
                    </h3>
                     <div className="mt-2 text-white space-y-1 text-center">
                        {workout.sets.sort((a,b) => a.set_order - b.set_order).map((set) => (
                            <div key={set.id}>{set.reps} reps @ {set.weight} lbs</div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-6 text-white">
        {exerciseName}
      </h2>

      {isResting && (
        <RestTimer
            duration={restDuration}
            onTimerEnd={handleTimerEnd}
            onSkip={handleTimerEnd}
          />
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4 text-center font-semibold text-gray-400">
            <div>#</div>
            <div>Reps</div>
            <div>Weight (lbs)</div>
            <div></div>
            <div></div>
        </div>
        {sets.map((set, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 items-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-700 text-white font-bold text-lg">
              {index + 1}
            </div>
            <div>
              <input
                type="number"
                value={set.reps}
                onChange={(e) =>
                  handleSetInputChange(index, "reps", e.target.value)
                }
                className="w-full bg-gray-800 text-white p-4 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                placeholder="0"
                disabled={set.logged}
              />
            </div>
            <div>
              <input
                type="number"
                value={set.weight}
                onChange={(e) =>
                  handleSetInputChange(index, "weight", e.target.value)
                }
                className="w-full bg-gray-800 text-white p-4 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                placeholder={isBodyweight ? "0" : "145"}
                disabled={set.logged}
              />
            </div>
            <button
              onClick={() => handleLogSet(index)}
              disabled={set.logged || isResting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {set.logged ? "Logged" : "Log Set"}
            </button>
            <button onClick={() => handleDeleteSet(index)} className="text-gray-500 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleAddSet}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-all"
        >
          Add Set
        </button>
        <button
          onClick={handleCompleteExercise}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-all"
        >
          Complete Exercise
        </button>
      </div>
      
      <div className="mt-6">
            <label htmlFor="rest-duration" className="block text-sm font-medium text-gray-400 mb-2 text-center">Rest Duration (seconds)</label>
            <input
              id="rest-duration"
              type="number"
              value={restDuration}
              onChange={handleRestTimeChange}
              className="w-full bg-gray-800 text-white p-4 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
              placeholder="120"
            />
      </div>
    </div>
  );
} 