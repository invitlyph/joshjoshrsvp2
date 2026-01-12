import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const STORAGE_BUCKET = Deno.env.get("STORAGE_BUCKET") || "wedding-media"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const UPLOAD_ALLOWED_ORIGIN = Deno.env.get("UPLOAD_ALLOWED_ORIGIN") || "*"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": UPLOAD_ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const getBearerToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) return null
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

const sanitizeSegment = (value: string, fallback: string) => {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return sanitized || fallback
}

const buildStoragePath = (folder: string, guestId: string, extension: string | null) => {
  const safeFolder = sanitizeSegment(folder || "misc", "misc")
  const safeGuest = sanitizeSegment(guestId || "guest", "guest")
  const suffix = `${Date.now()}-${crypto.randomUUID()}`
  return `${safeFolder}/${safeGuest}/${suffix}${extension ? `.${extension}` : ""}`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const reqHeaders = req.headers.get("Access-Control-Request-Headers")
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        ...(reqHeaders ? { "Access-Control-Allow-Headers": reqHeaders } : {}),
      },
    })
  }

  if (req.method !== "POST") return json(405, { error: "Method not allowed" })

  const token = getBearerToken(req.headers.get("Authorization"))
  if (!token) return json(401, { error: "Missing Authorization header." })

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !userData.user) return json(401, { error: "Invalid or expired access token." })

  const body = await req.json().catch(() => null) as null | {
    folder?: string
    guestId?: string
    fileName?: string
    contentType?: string
  }

  if (!body?.fileName) return json(400, { error: "fileName is required" })

  const folder = body.folder || "misc"
  const guestId = body.guestId || "guest"
  const fileName = body.fileName.trim()

  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? null : null
  const path = buildStoragePath(folder, guestId, extension)

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error("createSignedUploadUrl error:", error)
    return json(500, { error: "Failed to create signed upload url." })
  }

  return json(200, {
    bucket: STORAGE_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  })
})
