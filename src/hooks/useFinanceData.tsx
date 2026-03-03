import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Receita {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  recurrence?: string | null;
  recurrence_day?: number | null;
}

export interface Despesa {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "gasto" | "divida";
  details?: string;
  paid?: boolean;
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
  avatar_url?: string;
}

export interface Subscription {
  plan: "free" | "premium";
}

// Free plan limits
export const FREE_LIMITS = {
  receitas: 1,
  despesas: 2,
  metas: 0,
  allowSharedAccount: false,
};

// Sound utility
const playIncomeSound = () => {
  try {
    const audio = new Audio("/sounds/income-added.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
};

export const useFinanceData = () => {
  const { user } = useAuth();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription>({ plan: "free" });
  const [loading, setLoading] = useState(true);
  const addingRef = useRef(false);

  const isPremium = subscription.plan === "premium";

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [recRes, despRes, metRes, profRes, subRes] = await Promise.all([
      supabase.from("receitas").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("despesas").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("metas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (recRes.data) setReceitas(recRes.data as any);
    if (despRes.data) setDespesas(despRes.data as any);
    if (metRes.data) setMetas(metRes.data as any);
    if (profRes.data) setProfile(profRes.data as any);
    if (subRes.data) setSubscription(subRes.data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const canAddReceita = isPremium || receitas.length < FREE_LIMITS.receitas;
  const canAddDespesa = isPremium || despesas.length < FREE_LIMITS.despesas;
  const canAddMeta = isPremium || metas.length < FREE_LIMITS.metas;
  const canUseSharedAccount = isPremium;

  // --- Optimistic CRUD ---

  const addReceita = async (data: Omit<Receita, "id">) => {
    if (!user || addingRef.current) return;
    addingRef.current = true;
    const tempId = crypto.randomUUID();
    const optimistic = { ...data, id: tempId } as Receita;
    setReceitas(prev => [optimistic, ...prev]);
    const { error } = await supabase.from("receitas").insert({ ...data, user_id: user.id } as any);
    if (error) { setReceitas(prev => prev.filter(r => r.id !== tempId)); }
    else {
      playIncomeSound();
      const { data: fresh } = await supabase.from("receitas").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (fresh) setReceitas(fresh as any);
    }
    addingRef.current = false;
  };

  const addDespesa = async (data: Omit<Despesa, "id">) => {
    if (!user || addingRef.current) return;
    addingRef.current = true;
    const tempId = crypto.randomUUID();
    const optimistic = { ...data, id: tempId } as Despesa;
    setDespesas(prev => [optimistic, ...prev]);
    const { error } = await supabase.from("despesas").insert({ ...data, user_id: user.id } as any);
    if (error) { setDespesas(prev => prev.filter(d => d.id !== tempId)); }
    else {
      const { data: fresh } = await supabase.from("despesas").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (fresh) setDespesas(fresh as any);
    }
    addingRef.current = false;
  };

  // Add multiple despesas at once (for installments)
  const addMultipleDespesas = async (items: Omit<Despesa, "id">[]) => {
    if (!user || addingRef.current || items.length === 0) return;
    addingRef.current = true;
    const tempItems = items.map(item => ({ ...item, id: crypto.randomUUID() } as Despesa));
    setDespesas(prev => [...tempItems, ...prev]);
    const { error } = await supabase.from("despesas").insert(items.map(item => ({ ...item, user_id: user.id })) as any);
    if (error) {
      const tempIds = new Set(tempItems.map(t => t.id));
      setDespesas(prev => prev.filter(d => !tempIds.has(d.id)));
    } else {
      const { data: fresh } = await supabase.from("despesas").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (fresh) setDespesas(fresh as any);
    }
    addingRef.current = false;
  };

  const addMeta = async (data: Omit<Meta, "id">) => {
    if (!user || addingRef.current) return;
    addingRef.current = true;
    const tempId = crypto.randomUUID();
    const optimistic = { ...data, id: tempId } as Meta;
    setMetas(prev => [optimistic, ...prev]);
    const { error } = await supabase.from("metas").insert({ ...data, user_id: user.id } as any);
    if (error) { setMetas(prev => prev.filter(m => m.id !== tempId)); }
    else {
      const { data: fresh } = await supabase.from("metas").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (fresh) setMetas(fresh as any);
    }
    addingRef.current = false;
  };

  const updateReceita = async (id: string, data: Partial<Omit<Receita, "id">>) => {
    if (!user) return;
    setReceitas(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    await supabase.from("receitas").update(data as any).eq("id", id).eq("user_id", user.id);
  };

  const deleteReceita = async (id: string) => {
    if (!user) return;
    setReceitas(prev => prev.filter(r => r.id !== id));
    await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id);
  };

  const updateDespesa = async (id: string, data: Partial<Omit<Despesa, "id">>) => {
    if (!user) return;
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    await supabase.from("despesas").update(data as any).eq("id", id).eq("user_id", user.id);
  };

  const deleteDespesa = async (id: string) => {
    if (!user) return;
    setDespesas(prev => prev.filter(d => d.id !== id));
    await supabase.from("despesas").delete().eq("id", id).eq("user_id", user.id);
  };

  const toggleDespesaPaid = async (id: string, paid: boolean) => {
    if (!user) return;
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, paid } : d));
    await supabase.from("despesas").update({ paid } as any).eq("id", id).eq("user_id", user.id);
  };

  const updateMeta = async (id: string, data: Partial<Omit<Meta, "id">>) => {
    if (!user) return;
    setMetas(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    await supabase.from("metas").update(data as any).eq("id", id).eq("user_id", user.id);
  };

  const deleteMeta = async (id: string) => {
    if (!user) return;
    setMetas(prev => prev.filter(m => m.id !== id));
    await supabase.from("metas").delete().eq("id", id).eq("user_id", user.id);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    setProfile(prev => prev ? { ...prev, ...data } : null);
    await supabase.from("profiles").update(data as any).eq("user_id", user.id);
  };

  // Reset functions
  const resetReceitas = async () => {
    if (!user) return;
    setReceitas([]);
    await supabase.from("receitas").delete().eq("user_id", user.id);
  };

  const resetDespesas = async () => {
    if (!user) return;
    setDespesas([]);
    await supabase.from("despesas").delete().eq("user_id", user.id);
  };

  const resetMetas = async () => {
    if (!user) return;
    setMetas([]);
    await supabase.from("metas").delete().eq("user_id", user.id);
  };

  const resetAll = async (sections: { receitas?: boolean; despesas?: boolean; metas?: boolean }) => {
    if (!user) return;
    if (sections.receitas) setReceitas([]);
    if (sections.despesas) setDespesas([]);
    if (sections.metas) setMetas([]);
    const ops: PromiseLike<any>[] = [];
    if (sections.receitas) ops.push(supabase.from("receitas").delete().eq("user_id", user.id));
    if (sections.despesas) ops.push(supabase.from("despesas").delete().eq("user_id", user.id));
    if (sections.metas) ops.push(supabase.from("metas").delete().eq("user_id", user.id));
    await Promise.all(ops);
  };

  const totalReceitas = receitas.reduce((s, r) => s + Number(r.amount), 0);
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const gastos = despesas.filter(d => d.type === "gasto");
  const dividas = despesas.filter(d => d.type === "divida");
  const totalGastos = gastos.reduce((s, d) => s + Number(d.amount), 0);
  const totalDividas = dividas.reduce((s, d) => s + Number(d.amount), 0);

  return {
    receitas, despesas, metas, profile, subscription, loading, isPremium,
    addReceita, addDespesa, addMultipleDespesas, addMeta, updateProfile, fetchAll,
    updateReceita, deleteReceita, updateDespesa, deleteDespesa,
    toggleDespesaPaid, updateMeta, deleteMeta,
    totalReceitas, totalDespesas, saldo,
    gastos, dividas, totalGastos, totalDividas,
    canAddReceita, canAddDespesa, canAddMeta, canUseSharedAccount,
    resetReceitas, resetDespesas, resetMetas, resetAll,
  };
};
