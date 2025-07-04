"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { addSet } from "@/app/actions";
import RestTimer from "./RestTimer";

// A more flexible type for the exercise data we are passing in
type ExerciseWithSets = {
  id: number;
  exercise: string;
  sets: {
    id: number;
    reps: number;
    weight: number;
    created_at: string | null;
  }[];
};

interface LiftCardProps {
  exerciseName: string;
  workoutExercise: ExerciseWithSets | undefined;
}

export default function LiftCard({
  exerciseName,
  workoutExercise,
}: LiftCardProps) {
  const [isResting, setIsResting] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);
  
  const sets = useMemo(() => workoutExercise?.sets ?? [], [workoutExercise]);

  // Persist the last weight when sets change
  useEffect(() => {
    const validSets = sets.filter(s => s.created_at);
    if (validSets.length > 0) {
      const lastSet = [...validSets].sort((a,b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()).pop();
      if (lastSet) {
        setWeight(String(lastSet.weight));
      }
    }
  }, [sets]);

  const handleSetLogged = () => {
    setIsResting(true);
    setReps(""); // Clear reps
    // Weight is already persisted via state
  };

  const handleTimerEnd = () => {
    setIsResting(false);
    repsInputRef.current?.focus();
  };
  
  const isBodyweight = exerciseName === "Pull-ups";

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-6 text-white">{exerciseName}</h2>

      {isResting && (
        <RestTimer duration={120} onTimerEnd={handleTimerEnd} onSkip={handleTimerEnd} />
      )}
      
      <form
        ref={formRef}
        action={async (formData) => {
          await addSet(formData);
          handleSetLogged();
        }}
      >
        <input type="hidden" name="exerciseName" value={exerciseName} />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-400 mb-2">Reps</label>
            <input
              ref={repsInputRef}
              id="reps"
              name="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-gray-800 text-white p-4 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
              placeholder="12"
              required
            />
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-400 mb-2">
              {isBodyweight ? "Added Weight (lbs)" : "Weight (lbs)"}
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-gray-800 text-white p-4 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
              placeholder={isBodyweight ? "0" : "145"}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed"
          disabled={isResting}
        >
          {isResting ? "Resting..." : "Log Set & Start Rest"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-white">Session History</h3>
        <div className="space-y-3">
            {sets.length > 0 ? (
                sets.map((set) => (
                    <div key={set.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                            {set.created_at ? new Date(set.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saving...'}
                        </span>
                        <span className="font-semibold text-white">{set.reps} reps @ {set.weight} lbs</span>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500 py-4">Your sets for this session will appear here.</p>
            )}
        </div>
      </div>
    </div>
  );
} 