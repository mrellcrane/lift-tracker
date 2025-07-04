"use client";

import { useState, useRef, useEffect } from "react";
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
    created_at: string;
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
  const sets = workoutExercise?.sets ?? [];

  // Persist the last weight when sets change
  useEffect(() => {
    if (sets.length > 0) {
      const lastSet = [...sets].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).pop();
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
    <div className="p-6 bg-slate-800 rounded-2xl shadow-2xl">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">{exerciseName}</h2>

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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-slate-400 mb-1">Reps</label>
            <input
              ref={repsInputRef}
              id="reps"
              name="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-blue-500 outline-none transition text-center"
              placeholder="12"
              required
            />
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-slate-400 mb-1">
              {isBodyweight ? "Added Weight (lbs)" : "Weight (lbs)"}
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-blue-500 outline-none transition text-center"
              placeholder={isBodyweight ? "0" : "145"}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isResting}
        >
          {isResting ? "Resting..." : "Log Set & Start Rest"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-slate-300">Session History</h3>
        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {sets.length > 0 ? (
                sets.map((set) => (
                    <div key={set.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center text-sm">
                        <span className="text-slate-400">
                            {new Date(set.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-mono text-white">{set.reps} reps @ {set.weight} lbs</span>
                    </div>
                ))
            ) : (
                <p className="text-center text-slate-400 py-8">Your sets for this session will appear here.</p>
            )}
        </div>
      </div>
    </div>
  );
} 