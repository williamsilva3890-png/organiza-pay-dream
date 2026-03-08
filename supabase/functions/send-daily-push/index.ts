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
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: '📝 Já adicionou seus gastos hoje?',
      body: 'Mantenha suas finanças em dia registrando suas despesas diariamente!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: '/dashboard/despesas',
    });

    // Create VAPID JWT for authorization
    const results = [];
    for (const sub of subscriptions) {
      try {
        const result = await sendWebPush(
          sub.endpoint,
          sub.p256dh_key,
          sub.auth_key,
          payload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );
        results.push({ id: sub.id, success: result.ok });

        // Remove expired subscriptions
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Web Push implementation using crypto.subtle
async function sendWebPush(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<Response> {
  // Import VAPID keys
  const vapidPubKeyBytes = base64UrlDecode(vapidPublicKey);
  const vapidPrivKeyBytes = base64UrlDecode(vapidPrivateKey);

  // Reconstruct the private key from the 'd' parameter
  const vapidPrivateKeyJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(vapidPubKeyBytes.slice(1, 33)),
    y: base64UrlEncode(vapidPubKeyBytes.slice(33, 65)),
    d: vapidPrivateKey,
  };

  const signingKey = await crypto.subtle.importKey(
    'jwk',
    vapidPrivateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Create VAPID JWT
  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = {
    aud: audience,
    exp: expiration,
    sub: 'mailto:contato@organizapay.com',
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER format
    rawSig = derToRaw(sigBytes);
  }
  const jwt = `${unsignedToken}.${base64UrlEncode(rawSig)}`;

  // Encrypt payload using Web Push encryption (RFC 8291)
  const encrypted = await encryptPayload(
    p256dhKey,
    authKey,
    new TextEncoder().encode(payload)
  );

  // Send the push
  const response = await fetch(endpoint, {
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

  return response;
}

async function encryptPayload(
  p256dhKey: string,
  authKey: string,
  plaintext: Uint8Array
): Promise<Uint8Array> {
  // Decode subscriber keys
  const clientPublicKeyBytes = base64UrlDecode(p256dhKey);
  const clientAuthBytes = base64UrlDecode(authKey);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH key agreement
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Export local public key
  const localPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // HKDF to derive PRK from auth secret
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkKey = await crypto.subtle.importKey(
    'raw',
    clientAuthBytes,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // IKM = shared secret
  // salt = auth
  // Derive PRK using HKDF with auth as salt
  const ikm = await hkdfExtract(clientAuthBytes, sharedSecret);
  const prk = await hkdfExpand(ikm, concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKeyBytes,
    localPublicKeyBytes
  ), 32);

  // Derive content encryption key
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const cek = await hkdfExpand(prk, cekInfo, 16);

  // Derive nonce
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  // Add padding
  const paddedPlaintext = new Uint8Array(plaintext.length + 2);
  paddedPlaintext.set(plaintext);
  paddedPlaintext[plaintext.length] = 2; // delimiter
  paddedPlaintext[plaintext.length + 1] = 0; // padding

  // Encrypt with AES-128-GCM
  const key = await crypto.subtle.importKey(
    'raw',
    cek,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      paddedPlaintext
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Recalculate with actual salt
  const ikm2 = await hkdfExtract(clientAuthBytes, sharedSecret);
  const prk2 = await hkdfExpand(ikm2, concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKeyBytes,
    localPublicKeyBytes
  ), 32);
  const cek2 = await hkdfExpand(prk2, cekInfo, 16);
  const nonce2 = await hkdfExpand(prk2, nonceInfo, 12);

  const key2 = await crypto.subtle.importKey('raw', cek2, { name: 'AES-GCM' }, false, ['encrypt']);
  const finalCiphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce2 }, key2, paddedPlaintext)
  );

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, paddedPlaintext.length + 16 + 86); // record size

  const header = concatBuffers(
    salt,
    recordSize,
    new Uint8Array([65]), // keyid length
    localPublicKeyBytes
  );

  return concatBuffers(header, finalCiphertext);
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const input = concatBuffers(info, new Uint8Array([1]));
  const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, input));
  return output.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function derToRaw(der: Uint8Array): Uint8Array {
  // Parse DER SEQUENCE containing two INTEGERs
  const raw = new Uint8Array(64);
  let offset = 2; // skip SEQUENCE tag and length

  // First INTEGER (r)
  const rLen = der[offset + 1];
  offset += 2;
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // Second INTEGER (s)
  const sLen = der[offset + 1];
  offset += 2;
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}
