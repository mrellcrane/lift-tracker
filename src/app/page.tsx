import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/database.types";
import Dashboard from "./components/Dashboard";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all workout data for the logged-in user to build the chart
  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      `
      id,
      workout_date,
      workout_exercises (
        id,
        exercise,
        instance,
        sets (
          id,
          reps,
          weight,
          created_at,
          set_order
        )
      )
    `
    )
    .eq("user_id", session.user.id)
    .order("workout_date", { ascending: false });
  
  return <Dashboard allWorkouts={workouts} />;
}
