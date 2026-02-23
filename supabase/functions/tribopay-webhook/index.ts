import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("TriboPay webhook received:", JSON.stringify(payload));

    // TriboPay may send different payload formats - handle common patterns
    const email = payload.customer?.email || payload.email || payload.data?.customer?.email;
    const status = payload.status || payload.data?.status || payload.event;

    // Check if payment was approved/confirmed
    const isApproved = [
      "approved", "paid", "confirmed", "completed", "active",
      "transaction_approved", "payment_confirmed"
    ].some(s => 
      String(status).toLowerCase().includes(s) ||
      String(payload.event).toLowerCase().includes(s) ||
      String(payload.type).toLowerCase().includes(s)
    );

    if (!isApproved) {
      console.log("Payment not approved, status:", status);
      return new Response(
        JSON.stringify({ message: "Status recebido, mas não é aprovação", status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email) {
      console.error("No email found in webhook payload");
      return new Response(
        JSON.stringify({ error: "Email do cliente não encontrado no payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to update subscription
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.error("User not found for email:", email);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update subscription to premium
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ plan: "premium", updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    console.log(`User ${email} upgraded to premium successfully!`);

    return new Response(
      JSON.stringify({ success: true, message: `Plano Premium ativado para ${email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
