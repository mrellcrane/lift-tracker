"use client";

// We can remove the specific table types for now
// import type { Tables } from "@/lib/database.types";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import LiftCard from "./LiftCard";
import ProgressChart from "./ProgressChart";
import { signOut } from "../actions";
import WorkoutHistory from "./WorkoutHistory";

// A more flexible type for the workout data we are passing in
type WorkoutData = {
  id: number;
  workout_date: string;
  workout_exercises: {
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
  }[];
};

interface DashboardProps {
  // email: string | undefined; // No longer needed
  allWorkouts: WorkoutData[] | null;
}

export default function Dashboard({ allWorkouts }: DashboardProps) {
  const router = useRouter();
  const allLifts = ["Low Row", "Lat Pulldown", "Bench Press", "Pull-ups", "Leg Press", "Bicep Curl"];
  const [selectedLift, setSelectedLift] = useState(allLifts[2]); // Default to Bench Press

  const today = new Date().toISOString().slice(0, 10);
  const todaysWorkout = allWorkouts?.find(w => w.workout_date === today);

  const todaysExercises = todaysWorkout?.workout_exercises.filter(
    (we) => we.exercise === selectedLift
  ) ?? [];
  
  const historicalSets = allWorkouts
    ?.flatMap(w => w.workout_exercises)
    .filter(we => we.exercise === selectedLift)
    .flatMap(we => we.sets)
    .filter((set): set is typeof set & { created_at: string } => !!set.created_at)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) ?? [];
  
  const handleWorkoutComplete = () => {
    router.refresh();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 relative">
      <header className="text-center my-8">
        <h1 className="text-4xl font-bold text-white">LiftTrack</h1>
        <p className="text-slate-400 mt-2">Log your workouts. See your progress.</p>
        <form action={signOut} className="absolute top-0 right-4">
          <button
            type="submit"
            className="px-3 py-1 rounded-md text-sm font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            Log Out
          </button>
        </form>
      </header>
      
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {allLifts.map((lift) => {
          const isSelected = selectedLift === lift;
          const buttonClasses = isSelected
            ? "bg-blue-500 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700";
          
          return (
            <button
              key={lift}
              onClick={() => setSelectedLift(lift)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${buttonClasses}`}
            >
              {lift}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <LiftCard
          exerciseName={selectedLift}
          todaysWorkoutExercises={todaysExercises}
          onComplete={handleWorkoutComplete}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-center text-white mb-4">Progress Over Time</h2>
        <ProgressChart data={historicalSets} />
      </div>

      <WorkoutHistory allWorkouts={allWorkouts} exerciseName={selectedLift} />
    </div>
  );
} 