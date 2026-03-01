import { supabase } from "@/lib/supabase";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signUpWithUsername({
  email,
  password,
  username,
}: {
  email: string;
  password: string;
  username: string;
}) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) throw signUpError;

  const user = signUpData.user;
  if (!user) {
    return { status: "check_email" as const };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: user.id, username });
  if (profileError) throw profileError;

  return { status: "ok" as const, userId: user.id };
}
