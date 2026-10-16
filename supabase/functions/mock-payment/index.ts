import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }
  if (Deno.env.get('PAYMENT_MODE') !== 'mock') {
    return jsonResponse(
      { error: 'Mock payments are not enabled for this environment.' },
      503,
    );
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'A signed-in session is required.' }, 401);
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Payment function server configuration is incomplete.' },
      503,
    );
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: 'The signed-in session is invalid.' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Request body is invalid.' }, 400);
  }
  const { feeId, idempotencyKey } = body as Record<string, unknown>;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    typeof feeId !== 'string' ||
    !uuidPattern.test(feeId) ||
    typeof idempotencyKey !== 'string' ||
    !uuidPattern.test(idempotencyKey)
  ) {
    return jsonResponse(
      { error: 'A valid invoice ID and idempotency key are required.' },
      400,
    );
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: payment, error: paymentError } = await serviceClient.rpc(
    'mock_fee_payment',
    {
      target_fee: feeId,
      target_user: user.id,
      idempotency_key: idempotencyKey,
    },
  );
  if (paymentError) {
    return jsonResponse({ error: paymentError.message }, 400);
  }
  return jsonResponse({
    payment: {
      id: payment.id,
      fee_id: payment.fee_id,
      amount_paise: payment.amount_paise,
      status: payment.status,
      paid_at: payment.paid_at,
      provider_reference: payment.provider_reference,
      simulated: true,
    },
  });
});
