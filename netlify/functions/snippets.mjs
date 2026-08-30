/**
 * Fonction Netlify : stockage et récupération des extraits de texte.
 *
 * URL une fois déployée :
 *   https://internoclic.fr/.netlify/functions/snippets
 *
 * Les jetons sont lus depuis les variables d'environnement Netlify.
 *
 * SNIPPETS_WRITE_TOKEN  (obligatoire) : autorise l'écriture.
 * SNIPPETS_READ_TOKEN   (facultatif)  : si définie, la lecture exige ce
 *                       jeton. Si elle est absente, la lecture est
 *                       publique — ce qui convient quand les extraits ne
 *                       contiennent rien de sensible, et évite d'avoir à
 *                       saisir un jeton sur chaque ordinateur.
 *
 * GET  (+ jeton si configuré) -> renvoie { rev, updatedAt, snippets }
 * POST + jeton d'écriture   -> enregistre la liste
 *
 * La détection de conflit repose sur un numéro de révision qui
 * s'incrémente à chaque écriture, et non sur un horodatage : deux
 * publications dans la même seconde restent ainsi distinguables.
 */

import { getStore } from "@netlify/blobs";

const STORE_NAME = "text-expander";
const BLOB_KEY = "snippets";
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 Mo

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Sync-Token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" }
  });
}

/**
 * Comparaison à durée constante, pour ne pas laisser fuiter le jeton
 * caractère par caractère via le temps de réponse.
 */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function cleanSnippets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { trigger, expansion } = item;
    if (typeof trigger !== "string" || typeof expansion !== "string") continue;
    if (trigger === "") continue;
    out.push({ trigger, expansion });
  }
  return out;
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const READ_TOKEN = process.env.SNIPPETS_READ_TOKEN || "";
  const WRITE_TOKEN = process.env.SNIPPETS_WRITE_TOKEN || "";

  // Le jeton d'écriture est indispensable : sans lui, n'importe qui
  // pourrait remplacer la liste d'extraits.
  if (WRITE_TOKEN.length < 16) {
    return json(
      { error: "SNIPPETS_WRITE_TOKEN non configurée sur Netlify (16 caractères minimum)." },
      500
    );
  }
  // Le jeton de lecture est facultatif, mais s'il est défini il doit être
  // sérieux et différent du jeton d'écriture.
  const readProtected = READ_TOKEN.length > 0;
  if (readProtected && READ_TOKEN.length < 16) {
    return json({ error: "SNIPPETS_READ_TOKEN trop courte (16 caractères minimum)." }, 500);
  }
  if (readProtected && safeEqual(READ_TOKEN, WRITE_TOKEN)) {
    return json({ error: "Les jetons de lecture et d'écriture doivent être différents." }, 500);
  }

  const token = request.headers.get("x-sync-token") || "";
  const store = getStore(STORE_NAME);

  /* ------------------------------ LECTURE ----------------------------- */
  if (request.method === "GET") {
    if (readProtected && !safeEqual(token, READ_TOKEN) && !safeEqual(token, WRITE_TOKEN)) {
      return json({ error: "Jeton invalide" }, 401);
    }
    const record = await store.get(BLOB_KEY, { type: "json" });
    if (!record) {
      return json({ rev: 0, updatedAt: 0, snippets: [] });
    }
    return json({
      rev: Number(record.rev) || 0,
      updatedAt: Number(record.updatedAt) || 0,
      snippets: cleanSnippets(record.snippets)
    });
  }

  /* ------------------------------ ÉCRITURE ---------------------------- */
  if (request.method === "POST") {
    if (!safeEqual(token, WRITE_TOKEN)) {
      return json({ error: "Jeton d'écriture invalide" }, 401);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: "Contenu trop volumineux" }, 413);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ error: "JSON invalide" }, 400);
    }
    if (!payload || !Array.isArray(payload.snippets)) {
      return json({ error: "JSON invalide : champ 'snippets' attendu" }, 400);
    }

    // Détection de conflit : le client annonce la révision sur laquelle il
    // s'est basé. Si le serveur a avancé entre-temps, on refuse.
    const existing = await store.get(BLOB_KEY, { type: "json" });
    const remoteRev = existing ? Number(existing.rev) || 0 : 0;
    const baseRev = Number(payload.baseRev) || 0;

    if (!payload.force && remoteRev > 0 && baseRev !== remoteRev) {
      return json(
        {
          error: "conflit",
          remoteRev,
          remoteUpdatedAt: existing ? Number(existing.updatedAt) || 0 : 0,
          remoteCount: existing ? cleanSnippets(existing.snippets).length : 0
        },
        409
      );
    }

    const snippets = cleanSnippets(payload.snippets);
    const rev = remoteRev + 1;
    const updatedAt = Date.now();
    await store.setJSON(BLOB_KEY, { rev, updatedAt, snippets });

    return json({ ok: true, rev, updatedAt, count: snippets.length });
  }

  return json({ error: "Méthode non autorisée" }, 405);
};

export const config = {
  path: "/api/snippets"
};
