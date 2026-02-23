import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TRIBOPAY_TOKEN = Deno.env.get('TRIBOPAY_API_TOKEN');
    if (!TRIBOPAY_TOKEN) {
      throw new Error('TRIBOPAY_API_TOKEN is not configured');
    }

    const { name, phone, email, cpf, due_date, amount } = await req.json();

    if (!name || !phone || !email || !cpf || !amount) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: name, phone, email, cpf, amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create transaction via TriboPay API using query param for token
    const response = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions?api_token=${TRIBOPAY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        payment_method: 'pix',
        customer: {
          name: name,
          email: email,
          phone_number: phone.replace(/\D/g, ''),
          document: cpf.replace(/\D/g, ''),
        },
        cart: [
          {
            title: 'OrganizaPay Premium - Assinatura Mensal',
            price: amount,
            quantity: 1,
            operation_type: 1,
            tangible: false,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('TriboPay response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('TriboPay API error:', JSON.stringify(data));
      throw new Error(`TriboPay API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Return QR code data from response
    return new Response(
      JSON.stringify({
        qr_code: data.pix_qr_code || data.qr_code || '',
        hash: data.pix_code || data.hash || data.pix_qr_code || '',
        transaction_id: data.id || data.transaction_hash || '',
        status: data.status || 'pending',
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating TriboPay transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
