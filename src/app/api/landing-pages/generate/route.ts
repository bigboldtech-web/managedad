import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function ensureUniqueSlug(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rlOk } = rateLimit(`lp-gen:${session.user.id}`, 10, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many generation requests. Please wait." }, { status: 429 });
  }

  const { prompt, name } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const anthropic = getAnthropic();

  const systemPrompt = `You are an expert landing page copywriter and HTML developer. Generate a complete, self-contained single-page HTML landing page based on the user's brief.

Requirements:
- Use inline CSS only (no external stylesheets, no Tailwind CDN)
- Dark theme: background #09090b, text #fafafa, accent orange #f97316
- Mobile-responsive using flexbox/grid with media queries in a <style> tag
- Include: hero section with headline + subheadline, 3 benefit cards, social proof/trust elements, a prominent CTA button, simple footer
- Add a hidden span with id="dki-keyword" in the hero — the JS snippet will replace it with the UTM keyword: <span id="dki-keyword">our product</span>
- CTA button must have id="cta-button"
- Keep it clean, professional, conversion-focused
- Return ONLY valid HTML — no markdown, no code fences, no explanation`;

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  let htmlContent = (msg.content[0] as { type: string; text: string }).text || "";

  // Strip code fences if Claude wrapped it anyway
  htmlContent = htmlContent
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Inject DKI script just before </body>
  const dkiScript = `
<script>
(function(){
  try {
    var params = new URLSearchParams(window.location.search);
    var kw = params.get('utm_term') || params.get('keyword') || params.get('kw');
    if (kw) {
      var el = document.getElementById('dki-keyword');
      if (el) el.textContent = decodeURIComponent(kw.replace(/\\+/g, ' '));
    }
  } catch(e){}
  // Track conversion on CTA click
  var cta = document.getElementById('cta-button');
  if (cta) {
    cta.addEventListener('click', function() {
      var uid = '{{USER_ID}}';
      if (uid && uid !== '{{USER_ID}}') {
        fetch('/api/landing-pages/track?uid=' + uid + '&slug={{SLUG}}&event=conversion', { method: 'POST' }).catch(function(){});
      }
    });
  }
})();
</script>`;

  htmlContent = htmlContent.includes("</body>")
    ? htmlContent.replace("</body>", dkiScript + "\n</body>")
    : htmlContent + dkiScript;

  // Generate slug from name or prompt
  const pageName = name?.trim() || prompt.slice(0, 40);
  const baseSlug = slugify(pageName);

  // Check slug uniqueness
  const existing = await prisma.landingPage.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? ensureUniqueSlug(baseSlug) : baseSlug;

  // Replace placeholder tokens
  const finalHtml = htmlContent
    .replace(/\{\{USER_ID\}\}/g, session.user.id)
    .replace(/\{\{SLUG\}\}/g, slug);

  const page = await prisma.landingPage.create({
    data: {
      userId: session.user.id,
      name: pageName,
      slug,
      htmlContent: finalHtml,
      prompt,
      isPublished: false,
    },
  });

  return NextResponse.json({ page });
}
