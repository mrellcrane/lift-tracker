"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation'

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();
  redirect('/login');
}

export async function addSet(formData: FormData) {
  const exerciseName = formData.get("exerciseName") as string;
  const weight = Number(formData.get("weight"));
  const reps = Number(formData.get("reps"));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date().toISOString().slice(0, 10);

  // 1. Find or create today's workout
  let { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("workout_date", today)
    .single();

  if (!workout) {
    const { data, error } = await supabase
      .from("workouts")
      .insert({ user_id: user.id, workout_date: today })
      .select("id")
      .single();

    if (error) throw error;
    workout = data;
  }

  // 2. Find or create the workout exercise
  let { data: workoutExercise } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workout.id)
    .eq("exercise", exerciseName)
    .single();

  if (!workoutExercise) {
    const { data, error } = await supabase
      .from("workout_exercises")
      .insert({ workout_id: workout.id, exercise: exerciseName, seq: 1 }) // Assuming seq 1 for now
      .select("id")
      .single();
    
    if (error) throw error;
    workoutExercise = data;
  }

  // 3. Insert the new set
  const { error: setError } = await supabase.from("sets").insert({
    workout_exercise_id: workoutExercise.id,
    weight,
    reps,
    set_order: 1, // Assuming set_order 1 for now
    round: 1, // Assuming round 1 for now
  });

  if (setError) {
    throw setError;
  }

  // 4. Revalidate the path to show the new set
  revalidatePath("/");
} 