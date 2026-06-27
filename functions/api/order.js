export async function onRequestPost(context) {
  const { request, env } = context;

  // Make sure the environment variable is configured in Cloudflare Dashboard
  const webhookUrl = env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: "Webhook URL not configured in environment variables." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Parse the payload sent from the frontend
    const payload = await request.json();

    // Forward the payload to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (discordResponse.ok) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const errorText = await discordResponse.text();
      return new Response(JSON.stringify({ error: "Failed to send to Discord", details: errorText }), {
        status: discordResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
