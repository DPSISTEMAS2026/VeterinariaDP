"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface OrgMembership {
  id: string;
  organization_id: string;
  role: string;
  is_active: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    plan: string;
  };
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  memberships: OrgMembership[];
  currentOrg: OrgMembership | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  switchOrg: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(
    async (currentUser: User) => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch organization memberships
      const { data: memberData } = await supabase
        .from("organization_members")
        .select(
          `
          id,
          organization_id,
          role,
          is_active,
          organization:organizations (
            id,
            name,
            slug,
            logo_url,
            plan
          )
        `
        )
        .eq("user_id", currentUser.id)
        .eq("is_active", true);

      if (memberData && memberData.length > 0) {
        // Normalize the organization field (Supabase returns it as array or object depending on join)
        const normalized = memberData.map((m: Record<string, unknown>) => ({
          ...m,
          organization: Array.isArray(m.organization)
            ? m.organization[0]
            : m.organization,
        })) as OrgMembership[];

        setMemberships(normalized);

        // Restore last selected org from localStorage, or default to first
        const savedOrgId = localStorage.getItem("dp_current_org");
        const savedOrg = normalized.find(
          (m) => m.organization_id === savedOrgId
        );
        setCurrentOrg(savedOrg || normalized[0]);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchUserData(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchUserData(s.user);
      } else {
        setProfile(null);
        setMemberships([]);
        setCurrentOrg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserData]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    localStorage.removeItem("dp_current_org");
    await supabase.auth.signOut();
  }

  function switchOrg(orgId: string) {
    const org = memberships.find((m) => m.organization_id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem("dp_current_org", orgId);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        memberships,
        currentOrg,
        loading,
        signIn,
        signOut,
        switchOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
