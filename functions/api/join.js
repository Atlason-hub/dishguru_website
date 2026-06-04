function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const companyName = String(body.companyName || "").trim();
    const contactName = String(body.contactName || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const sourceLanguage = String(body.language || "he").trim();

    if (!companyName) {
      return json(
        { ok: false, field: "companyName", message: "Company name is required." },
        400
      );
    }

    if (!contactName) {
      return json(
        { ok: false, field: "contactName", message: "Contact name is required." },
        400
      );
    }

    if (!contactEmail) {
      return json(
        { ok: false, field: "contactEmail", message: "Contact email is required." },
        400
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return json(
        { ok: false, field: "contactEmail", message: "Valid email is required." },
        400
      );
    }

    if (!env.RESEND_API_KEY || !env.JOIN_FORM_TO_EMAIL || !env.JOIN_FORM_FROM_EMAIL) {
      return json(
        { ok: false, message: "Server email configuration is missing." },
        500
      );
    }

    const safeCompanyName = escapeHtml(companyName);
    const safeContactName = escapeHtml(contactName);
    const safeContactEmail = escapeHtml(contactEmail);
    const safeLanguage = escapeHtml(sourceLanguage === "en" ? "English" : "Hebrew");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.JOIN_FORM_FROM_EMAIL,
        to: [env.JOIN_FORM_TO_EMAIL],
        reply_to: contactEmail,
        subject: `New DishGuru company request: ${companyName}`,
        html: `
          <h2>New DishGuru company request</h2>
          <p><strong>Company name:</strong> ${safeCompanyName}</p>
          <p><strong>Contact name:</strong> ${safeContactName}</p>
          <p><strong>Contact email:</strong> ${safeContactEmail}</p>
          <p><strong>Site language:</strong> ${safeLanguage}</p>
        `
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return json(
        {
          ok: false,
          message: "Email send failed.",
          details: errorText
        },
        502
      );
    }

    return json({ ok: true });
  } catch {
    return json(
      { ok: false, message: "Unexpected server error." },
      500
    );
  }
}
