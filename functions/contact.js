export async function onRequestPost(context) {
  const { request, env } = context;

  const rateLimitKv = env.RATE_LIMIT_KV;
  if (rateLimitKv) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown-ip";
    const urlPath = new URL(request.url).pathname;
    const rlKey = `RL_${ip}_${urlPath}`;

    const currentRequests = parseInt((await rateLimitKv.get(rlKey)) || "0", 10);
    const MAX_REQUESTS = 5; 
    const WINDOW_SECONDS = 60;

    if (currentRequests >= MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Veuillez réessayer dans une minute." }), 
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    await rateLimitKv.put(rlKey, (currentRequests + 1).toString(), { expirationTtl: WINDOW_SECONDS });
  }

  try {
    const checkStatus = await fetch(`https://api.skyxgames.com/status?t=${Date.now()}`, {
      headers: {
        'Referer': 'https://skyxgames.com/',
        'User-Agent': 'SKG-Worker-Internal/1.0',
        'Accept': 'application/json'
      }
    });

    if (checkStatus.ok) {
      const data = await checkStatus.json();
      const lockStatus = data?.rows?.[1]?.[13]?.trim();

      if (lockStatus === "1") {
        return new Response(
          JSON.stringify({ error: "Mode quarantaine actif. Action suspendue." }), 
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  } catch (secErr) {
    return new Response(
      JSON.stringify({ error: "Échec de connexion à l'API de sécurité : " + secErr.message }), 
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Format de requête invalide (JSON attendu)." }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { name, email, subject, message, hp_field, 'cf-turnstile-response': turnstileToken } = body;

  if (hp_field) {
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  if (!name || !email || !subject || !message) {
    return new Response(
      JSON.stringify({ error: "Veuillez remplir tous les champs obligatoires." }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const TURNSTILE_SECRET = env.TURNSTILE_SECRET_KEY;
  if (TURNSTILE_SECRET && turnstileToken) {
    const ip = request.headers.get("cf-connecting-ip");
    const tsFormData = new FormData();
    tsFormData.append('secret', TURNSTILE_SECRET);
    tsFormData.append('response', turnstileToken);
    if (ip) tsFormData.append('remoteip', ip);

    const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: tsFormData
    });
    const tsOutcome = await tsRes.json();

    if (!tsOutcome.success) {
      return new Response(
        JSON.stringify({ error: "Échec de la vérification Anti-Bot Turnstile." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const DISCORD_WEBHOOK = env.DISCORD_WEBHOOK_URL;
  const SCW_SECRET_KEY = env.SCW_SECRET_KEY;
  const SCW_DEFAULT_PROJECT_ID = env.SCW_DEFAULT_PROJECT_ID;

  const discordTitle = "📬 NOUVEAU MESSAGE DE CONTACT";
  const discordColor = 13940023; 
  const emailSubject = `[PORTFOLIO] ${subject} — ${name}`;

  const fields = [
    { name: "Nom / Prénom", value: name, inline: true },
    { name: "Email Pro", value: email, inline: true },
    { name: "Sujet", value: subject },
    { name: "Message", value: message }
  ];

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #D4AF37; padding: 25px; border-radius: 4px; background-color: #ffffff;">
      <h2 style="color: #D4AF37; margin-top: 0; text-transform: uppercase;">Nouveau message - Portfolio</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;"><strong>Message :</strong><br>${message}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 11px; color: #888;">Envoyé via le formulaire de contact le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
    </div>
  `;

  const dispatchPromises = [];

  if (DISCORD_WEBHOOK) {
    dispatchPromises.push(
      fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: discordTitle,
            color: discordColor,
            fields: fields,
            footer: { text: "SkyX Infrastructure — Portfolio Contact" },
            timestamp: new Date().toISOString()
          }]
        })
      })
    );
  }

  if (SCW_SECRET_KEY && SCW_DEFAULT_PROJECT_ID) {
    const scalewayPayload = JSON.stringify({
      project_id: SCW_DEFAULT_PROJECT_ID,
      from: {
        email: "concierge@skyxgames.com",
        name: "SkyX Concierge"
      },
      to: [
        { email: "briensnoa23@gmail.com" }
      ],
      reply_to: email.includes('@') ? { email: email } : undefined,
      subject: emailSubject,
      html: htmlContent
    });

    dispatchPromises.push(
      fetch("https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails", {
        method: 'POST',
        headers: {
          'X-Auth-Token': SCW_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        body: scalewayPayload
      })
    );
  }

  try {
    await Promise.all(dispatchPromises);

    return new Response(
      JSON.stringify({ success: true, message: "Message transmis avec succès." }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement de l'envoi : " + err.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}