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
    console.log("[send-push] Function invoked");
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    console.log("[send-push] VAPID keys present:", !!VAPID_PUBLIC_KEY, !!VAPID_PRIVATE_KEY);

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    // body.type: "to_admin" | "to_all" | "daily_summary"
    // body.title, body.body, body.url (optional)

    const { type, title, body: msgBody, url } = body;
    console.log("[send-push] Type:", type, "Title:", title);

    let subscriptions: any[] = [];

    if (type === "to_admin") {
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r: any) => r.user_id);
        const { data } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', adminIds);
        subscriptions = data || [];
        console.log("[send-push] Admin subscriptions found:", subscriptions.length);
      }
    } else if (type === "to_user") {
      const targetUserId = body.user_id;
      if (targetUserId) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', targetUserId);
        subscriptions = data || [];
      }
    } else if (type === "to_all") {
      const { data } = await supabase.from('push_subscriptions').select('*');
      subscriptions = data || [];
    } else if (type === "daily_summary") {
      // Get all subscriptions and send personalized summaries
      const { data: subs } = await supabase.from('push_subscriptions').select('*');
      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ message: "No subscriptions" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Group by user
      const userSubs = new Map<string, any[]>();
      for (const sub of subs) {
        if (!userSubs.has(sub.user_id)) userSubs.set(sub.user_id, []);
        userSubs.get(sub.user_id)!.push(sub);
      }

      const today = new Date().toISOString().slice(0, 10);
      const results: any[] = [];

      for (const [userId, userSubscriptions] of userSubs) {
        // Get today's expenses
        const { data: despesas } = await supabase
          .from('despesas')
          .select('amount')
          .eq('user_id', userId)
          .gte('date', today);

        const totalDespesas = (despesas || []).reduce((sum: number, d: any) => sum + Number(d.amount), 0);

        // Get today's income
        const { data: receitas } = await supabase
          .from('receitas')
          .select('amount')
          .eq('user_id', userId)
          .gte('date', today);

        const totalReceitas = (receitas || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);

        const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        const saldo = totalReceitas - totalDespesas;

        const summaryTitle = "📊 Resumo do dia";
        const summaryBody = `Receitas: ${fmt(totalReceitas)} | Despesas: ${fmt(totalDespesas)} | Saldo: ${fmt(saldo)}`;

        const payload = JSON.stringify({
          title: summaryTitle,
          body: summaryBody,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          url: '/dashboard',
        });

        for (const sub of userSubscriptions) {
          try {
            const result = await sendWebPush(sub.endpoint, sub.p256dh_key, sub.auth_key, payload, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
            results.push({ id: sub.id, success: result.ok });
            if (result.status === 410 || result.status === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          } catch (err) {
            results.push({ id: sub.id, success: false, error: err.message });
          }
        }
      }

      return new Response(JSON.stringify({ sent: results.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (subscriptions.length === 0 && type !== "daily_summary") {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: title || 'OrganizaPay',
      body: msgBody || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: url || '/dashboard',
    });

    const results: any[] = [];
    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(sub.endpoint, sub.p256dh_key, sub.auth_key, payload, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        results.push({ id: sub.id, success: result.ok });
        if (result.status === 410 || result.status === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      } catch (err) {
        results.push({ id: sub.id, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ---- Web Push crypto helpers (same as send-daily-push) ----

async function sendWebPush(endpoint: string, p256dhKey: string, authKey: string, payload: string, vapidPublicKey: string, vapidPrivateKey: string): Promise<Response> {
  console.log("[send-push] sendWebPush called, endpoint:", endpoint.substring(0, 60));
  console.log("[send-push] vapidPublicKey length:", vapidPublicKey.length, "vapidPrivateKey length:", vapidPrivateKey.length);
  
  const vapidPubKeyBytes = base64UrlDecode(vapidPublicKey);
  console.log("[send-push] vapidPubKeyBytes length:", vapidPubKeyBytes.length, "first byte:", vapidPubKeyBytes[0]);
  
  const x = base64UrlEncode(vapidPubKeyBytes.slice(1, 33));
  const y = base64UrlEncode(vapidPubKeyBytes.slice(33, 65));
  // Ensure d parameter has no padding issues
  const d = vapidPrivateKey.replace(/=+$/, '');
  
  console.log("[send-push] JWK x length:", x.length, "y length:", y.length, "d length:", d.length);
  
  const vapidPrivateKeyJwk = { kty: 'EC', crv: 'P-256', x, y, d };
  
  let signingKey;
  try {
    signingKey = await crypto.subtle.importKey('jwk', vapidPrivateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } catch (err) {
    console.error("[send-push] importKey failed:", err.message);
    throw new Error("invalid b64 coordinate: " + err.message);
  }

  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = { aud: audience, exp: expiration, sub: 'mailto:contato@organizapay.com' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, new TextEncoder().encode(unsignedToken));
  const sigBytes = new Uint8Array(signature);
  const rawSig = sigBytes.length === 64 ? sigBytes : derToRaw(sigBytes);
  const jwt = `${unsignedToken}.${base64UrlEncode(rawSig)}`;

  const encrypted = await encryptPayload(p256dhKey, authKey, new TextEncoder().encode(payload));

  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: encrypted,
  });
}

async function encryptPayload(p256dhKey: string, authKey: string, plaintext: Uint8Array): Promise<Uint8Array> {
  const clientPublicKeyBytes = base64UrlDecode(p256dhKey);
  const clientAuthBytes = base64UrlDecode(authKey);
  const localKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const clientPublicKey = await crypto.subtle.importKey('raw', clientPublicKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPublicKey }, localKeyPair.privateKey, 256));
  const localPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', localKeyPair.publicKey));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdfExtract(clientAuthBytes, sharedSecret);
  const prk = await hkdfExpand(ikm, concatBuffers(new TextEncoder().encode('WebPush: info\0'), clientPublicKeyBytes, localPublicKeyBytes), 32);
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const cek = await hkdfExpand(prk, cekInfo, 16);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  const paddedPlaintext = new Uint8Array(plaintext.length + 2);
  paddedPlaintext.set(plaintext);
  paddedPlaintext[plaintext.length] = 2;

  const key = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, paddedPlaintext));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, paddedPlaintext.length + 16 + 86);

  return concatBuffers(salt, recordSize, new Uint8Array([65]), localPublicKeyBytes, ciphertext);
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, concatBuffers(info, new Uint8Array([1]))));
  return output.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(buffers.reduce((s, b) => s + b.length, 0));
  let offset = 0;
  for (const b of buffers) { result.set(b, offset); offset += b.length; }
  return result;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = (str + '='.repeat((4 - str.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  let offset = 2;
  const rLen = der[offset + 1]; offset += 2;
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  raw.set(der.slice(rStart, offset + rLen), rLen < 32 ? 32 - rLen : 0);
  offset += rLen;
  const sLen = der[offset + 1]; offset += 2;
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  raw.set(der.slice(sStart, offset + sLen), sLen < 32 ? 64 - sLen : 32);
  return raw;
}
