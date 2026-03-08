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
    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    // Export public key as raw (uncompressed, 65 bytes)
    const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64url = base64UrlEncode(new Uint8Array(publicKeyBuffer));

    // Export private key as JWK to get the 'd' parameter
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const privateKeyBase64url = jwk.d!;

    return new Response(JSON.stringify({
      publicKey: publicKeyBase64url,
      privateKey: privateKeyBase64url,
      instructions: "Store publicKey as VAPID_PUBLIC_KEY and privateKey as VAPID_PRIVATE_KEY in your secrets."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
