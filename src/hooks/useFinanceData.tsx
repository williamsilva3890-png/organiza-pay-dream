import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Receita {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface Despesa {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "gasto" | "divida";
  details?: string;
}

export interface Meta {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline: string;
  description?: string;
}

export interface Profile {
  display_name: string;
  profile_type: string;
}

export const useFinanceData = () => {
  const { user } = useAuth();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [recRes, despRes, metRes, profRes] = await Promise.all([
      supabase.from("receitas").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("despesas").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("metas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (recRes.data) setReceitas(recRes.data as any);
    if (despRes.data) setDespesas(despRes.data as any);
    if (metRes.data) setMetas(metRes.data as any);
    if (profRes.data) setProfile(profRes.data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addReceita = async (data: Omit<Receita, "id">) => {
    if (!user) return;
    await supabase.from("receitas").insert({ ...data, user_id: user.id } as any);
    fetchAll();
  };

  const addDespesa = async (data: Omit<Despesa, "id">) => {
    if (!user) return;
    await supabase.from("despesas").insert({ ...data, user_id: user.id } as any);
    fetchAll();
  };

  const addMeta = async (data: Omit<Meta, "id">) => {
    if (!user) return;
    await supabase.from("metas").insert({ ...data, user_id: user.id } as any);
    fetchAll();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    await supabase.from("profiles").update(data as any).eq("user_id", user.id);
    fetchAll();
  };

  const totalReceitas = receitas.reduce((s, r) => s + Number(r.amount), 0);
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const gastos = despesas.filter(d => d.type === "gasto");
  const dividas = despesas.filter(d => d.type === "divida");
  const totalGastos = gastos.reduce((s, d) => s + Number(d.amount), 0);
  const totalDividas = dividas.reduce((s, d) => s + Number(d.amount), 0);

  return {
    receitas, despesas, metas, profile, loading,
    addReceita, addDespesa, addMeta, updateProfile, fetchAll,
    totalReceitas, totalDespesas, saldo,
    gastos, dividas, totalGastos, totalDividas,
  };
};
