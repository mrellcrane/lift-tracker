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

export async function getExerciseSettings(exerciseName: string) {
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
    return {
        rest_duration_seconds: 120,
        default_sets: 5,
    }
  }
  
  // We no longer read `default_sets` from the database. It is now fixed at 5.
  const { data: setting } = await supabase
    .from("exercise_settings")
    .select("rest_duration_seconds")
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName)
    .single();

  return {
    rest_duration_seconds: setting?.rest_duration_seconds ?? 120,
    default_sets: 5, // Always return 5, ignoring any bad data in the DB
  };
}

export async function updateExerciseSettings(exerciseName: string, settings: { rest_duration_seconds?: number }) {
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

  const { error } = await supabase
    .from("exercise_settings")
    .update(settings)
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName);

  if (error) {
    console.error("Error updating rest time:", error);
    throw new Error("Could not update rest time.");
  }

  revalidatePath("/"); // Revalidate to reflect changes
}

export async function createWorkoutExerciseInstance(exerciseName: string) {
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
    const { data: newWorkout, error } = await supabase
      .from("workouts")
      .insert({ user_id: user.id, workout_date: today })
      .select("id")
      .single();

    if (error) throw error;
    workout = newWorkout;
  }
  
  // 2. Find the latest instance number for this exercise on this day
  const { data: latestInstance, error: instanceError } = await supabase
    .from("workout_exercises")
    .select("instance")
    .eq("workout_id", workout.id)
    .eq("exercise", exerciseName)
    .order("instance", { ascending: false })
    .limit(1)
    .single();
  
  if (instanceError && instanceError.code !== 'PGRST116') { // Ignore 'not found' error
    throw instanceError;
  }

  const newInstanceNumber = (latestInstance?.instance ?? 0) + 1;

  // 3. Create the new workout_exercise instance
  const { data: newWorkoutExercise, error: createError } = await supabase
    .from("workout_exercises")
    .insert({
      workout_id: workout.id,
      exercise: exerciseName,
      instance: newInstanceNumber,
      seq: 1, // 'seq' might be legacy, but we'll keep it for now
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newWorkoutExercise;
}

export async function logSet(
  workoutExerciseId: number,
  setOrder: number,
  reps: number,
  weight: number
) {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  const { data, error } = await supabase
    .from("sets")
    .insert({
      workout_exercise_id: workoutExerciseId,
      reps,
      weight,
      set_order: setOrder,
      round: 1, // keep round as 1 for now
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting set:", error);
    throw new Error("Could not log set.");
  }

  // Intentionally removed revalidatePath("/") to prevent a full page refresh
  // The client-side state will handle the UI update optimistically.
  return data;
}

export async function deleteSet(setId: number) {
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

  const { error } = await supabase.from("sets").delete().eq("id", setId);

  if (error) {
    console.error("Error deleting set:", error);
    throw new Error("Could not delete set.");
  }
}

// This function is no longer needed to update settings, as that was the source of the bug.
// It can be removed entirely.
// export async function completeExercise(exerciseName: string) {
//   console.log(`Completed exercise: ${exerciseName}`);
// } 