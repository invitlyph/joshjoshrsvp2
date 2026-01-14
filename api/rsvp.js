const RSVP_TABLE_PATH =
  '/rest/v1/responses?select=id,name,status,message,guest_count,guest_names,created_at&order=created_at.desc';
const INSERT_PATH = '/rest/v1/responses';
const ALLOWED_STATUSES = new Set(['yes', 'no', 'maybe']);

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function clampGuestCount(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), 12);
}

function normalizeStatus(value) {
  const normalized = (value || '').toString().toLowerCase();
  return ALLOWED_STATUSES.has(normalized) ? normalized : 'yes';
}

function sanitizeGuestList(primaryName, extras) {
  const fromExtras = Array.isArray(extras) ? extras : [];
  const combined = [primaryName, ...fromExtras]
    .map((entry) => (entry || '').toString().trim())
    .filter(Boolean);
  return {
    combined: combined.join(', '),
    extras: fromExtras
  };
}

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: 'Supabase environment variables are missing' });
    return;
  }

  const callSupabase = (path, init = {}) => {
    const headers = Object.assign(
      {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      init.headers || {}
    );

    if (!headers['Content-Type'] && init.body) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${supabaseUrl}${path}`, {
      ...init,
      headers
    });
  };

  if (req.method === 'GET') {
    try {
      const response = await callSupabase(RSVP_TABLE_PATH);
      const payload = await response.text();
      if (!response.ok) {
        throw new Error(payload || 'Failed to load responses');
      }

      const data = payload ? JSON.parse(payload) : [];
      res.status(200).json({ responses: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('[RSVP] Failed to fetch responses:', error);
      res.status(500).json({ error: 'Unable to load responses' });
    }
    return;
  }

  if (req.method === 'POST') {
    const body = parseBody(req.body);
    const name = (body.name || '').toString().trim();

    if (!name) {
      res.status(400).json({ error: 'Your name is required' });
      return;
    }

    const guestCount = clampGuestCount(body.guestCount);
    const status = normalizeStatus(body.status);
    const message = (body.message || '').toString().trim().slice(0, 320);
    const { combined } = sanitizeGuestList(name, body.guestNames);

    try {
      const response = await callSupabase(INSERT_PATH, {
        method: 'POST',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          name,
          status,
          message,
          guest_count: guestCount,
          guest_names: combined,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || 'Failed to save RSVP');
      }

      res.status(201).json({ ok: true });
    } catch (error) {
      console.error('[RSVP] Failed to submit response:', error);
      res.status(500).json({ error: 'Unable to submit your RSVP right now' });
    }
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method Not Allowed');
};
