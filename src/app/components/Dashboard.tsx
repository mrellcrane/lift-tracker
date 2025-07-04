"use client";

// We can remove the specific table types for now
// import type { Tables } from "@/lib/database.types";

// A more flexible type for the workout data we are passing in
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

import { useState } from "react";
import LiftCard from "./LiftCard";
import ProgressChart from "./ProgressChart";
import { signOut } from "../actions";

interface DashboardProps {
  // email: string | undefined; // No longer needed
  allWorkouts: WorkoutData[] | null;
}

export default function Dashboard({ allWorkouts }: DashboardProps) {
  const allLifts = ["Low Row", "Lat Pulldown", "Bench Press", "Pull-ups", "Leg Press", "Bicep Curl"];
  const [selectedLift, setSelectedLift] = useState(allLifts[2]); // Default to Bench Press
  
  const today = new Date().toISOString().slice(0, 10);
  const todaysWorkout = allWorkouts?.find(w => w.workout_date === today);
  const todaysExercise = todaysWorkout?.workout_exercises.find(
    (we) => we.exercise === selectedLift
  );
  
  const historicalSets = allWorkouts
    ?.flatMap(w => w.workout_exercises)
    .filter(we => we.exercise === selectedLift)
    .flatMap(we => we.sets)
    .filter((set): set is typeof set & { created_at: string } => !!set.created_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) ?? [];

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <header className="text-center my-8 relative">
        <h1 className="text-4xl font-bold text-blue-400">LiftTrack</h1>
        <p className="text-slate-400">Log your workouts. See your progress.</p>
        <form action={signOut} className="absolute top-0 right-0">
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            Log Out
          </button>
        </form>
      </header>
      
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {allLifts.map((lift) => (
          <button
            key={lift}
            onClick={() => setSelectedLift(lift)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedLift === lift
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {lift}
          </button>
        ))}
      </div>

      <LiftCard
        exerciseName={selectedLift}
        workoutExercise={todaysExercise}
      />
      <div className="mt-8">
        <ProgressChart data={historicalSets} />
      </div>
    </div>
  );
} 