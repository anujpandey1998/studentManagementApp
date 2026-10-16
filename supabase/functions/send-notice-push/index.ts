import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function respond(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function encodeBase64Url(value: string | Uint8Array): string {
  let bytes: string;
  if (typeof value === 'string') {
    bytes = value;
  } else {
    bytes = Array.from(value, byte => String.fromCharCode(byte)).join('');
  }
  // return btoa(bytes).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return btoa(bytes)
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(account: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = encodeBase64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: FCM_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const pem = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pem), char => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${encodeBase64Url(
    new Uint8Array(signature),
  )}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Firebase access token request failed (${response.status}).`,
    );
  }
  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error('Firebase returned no access token.');
  }
  return token.access_token;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return respond({ error: 'Method not allowed.' }, 405);
  }
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return respond({ error: 'A signed-in session is required.' }, 401);
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (
    !supabaseUrl ||
    !publishableKey ||
    !serviceRoleKey ||
    !serviceAccountJson
  ) {
    return respond(
      { error: 'Push delivery server configuration is incomplete.' },
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
    return respond({ error: 'The signed-in session is invalid.' }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return respond({ error: 'Request body must be valid JSON.' }, 400);
  }
  const noticeId =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>).noticeId
      : null;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof noticeId !== 'string' || !uuidPattern.test(noticeId)) {
    return respond({ error: 'A valid notice ID is required.' }, 400);
  }

  const { data: notice, error: noticeError } = await userClient
    .from('notices')
    .select('id,institute_id,section_id,title,body,created_by')
    .eq('id', noticeId)
    .maybeSingle();
  if (noticeError || !notice) {
    return respond(
      { error: noticeError?.message ?? 'Notice not found or not accessible.' },
      403,
    );
  }
  if (notice.created_by !== user.id) {
    return respond(
      { error: 'Only the notice author can request delivery.' },
      403,
    );
  }

  let serviceAccount: { client_email: string; private_key: string };
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    return respond({ error: 'Firebase service account JSON is invalid.' }, 503);
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    return respond(
      { error: 'Firebase service account fields are missing.' },
      503,
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: claimed, error: claimError } = await userClient.rpc(
    'claim_notice_push',
    { target_notice: notice.id },
  );
  if (claimError) {
    return respond({ error: claimError.message }, 403);
  }
  if (!claimed) {
    return respond(
      { error: 'This notice was already sent or is being delivered.' },
      409,
    );
  }
  let userIds: string[];
  if (notice.section_id) {
    const [students, teachers, administrators] = await Promise.all([
      admin
        .from('students')
        .select('user_id')
        .eq('institute_id', notice.institute_id)
        .eq('section_id', notice.section_id)
        .not('user_id', 'is', null),
      admin
        .from('teacher_allocations')
        .select('teacher_id')
        .eq('institute_id', notice.institute_id)
        .eq('section_id', notice.section_id),
      admin
        .from('users')
        .select('id')
        .eq('institute_id', notice.institute_id)
        .eq('role', 'admin'),
    ]);
    const audienceError =
      students.error ?? teachers.error ?? administrators.error;
    if (audienceError) {
      return respond({ error: audienceError.message }, 500);
    }
    userIds = [
      ...new Set([
        ...(students.data ?? []).map(row => row.user_id as string),
        ...(teachers.data ?? []).map(row => row.teacher_id),
        ...(administrators.data ?? []).map(row => row.id),
      ]),
    ];
  } else {
    const { data, error } = await admin
      .from('users')
      .select('id')
      .eq('institute_id', notice.institute_id);
    if (error) {
      return respond({ error: error.message }, 500);
    }
    userIds = (data ?? []).map(row => row.id);
  }

  if (userIds.length === 0) {
    await admin
      .from('notices')
      .update({ push_sent_at: new Date().toISOString() })
      .eq('id', notice.id);
    return respond({ sent: 0, failed: 0 });
  }
  const { data: devices, error: deviceError } = await admin
    .from('device_tokens')
    .select('token')
    .in('user_id', userIds);
  if (deviceError) {
    return respond({ error: deviceError.message }, 500);
  }
  if (!devices?.length) {
    await admin
      .from('notices')
      .update({ push_sent_at: new Date().toISOString() })
      .eq('id', notice.id);
    return respond({ sent: 0, failed: 0 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(serviceAccount);
  } catch (error) {
    return respond(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Firebase authorization failed.',
      },
      502,
    );
  }
  const projectId = (serviceAccount as { project_id?: string }).project_id;
  if (!projectId) {
    return respond({ error: 'Firebase project_id is missing.' }, 503);
  }
  const results = await Promise.all(
    devices.map(async device => {
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
            projectId,
          )}/messages:send`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: device.token,
                notification: { title: notice.title, body: notice.body },
                data: { noticeId: notice.id },
              },
            }),
          },
        );
        return response.ok;
      } catch {
        return false;
      }
    }),
  );
  const sent = results.filter(Boolean).length;
  const failed = results.length - sent;
  if (sent > 0) {
    const { error: sentAtError } = await admin
      .from('notices')
      .update({ push_sent_at: new Date().toISOString() })
      .eq('id', notice.id);
    if (sentAtError) {
      return respond(
        {
          sent,
          failed,
          error: 'Push sent, but delivery state could not be saved.',
        },
        500,
      );
    }
  }
  return respond({ sent, failed }, failed ? 207 : 200);
});
