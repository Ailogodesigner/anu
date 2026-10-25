import { prisma } from "../prisma";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiResponseResult {
  reply: string;
  sourceArticles: Array<{ id: string; title: string; slug: string }>;
  shouldEscalate: boolean;
  escalationReason?: string;
  usedProvider: string;
  tokensUsed: number;
}

/**
 * Keywords and phrases indicating a customer wants human assistance
 */
const HUMAN_ESCALATION_PHRASES = [
  "talk to a human",
  "human agent",
  "real person",
  "talk to staff",
  "contact support",
  "operator",
  "speak to someone",
  "escalate",
  "human please",
  "live agent",
  "representative",
  "not a bot",
  "cancel subscription",
  "legal action",
];

/**
 * Check if the user's message contains escalation triggers
 */
export function checkEscalationTriggers(
  userMessage: string,
  history: AiChatMessage[] = []
): { shouldEscalate: boolean; reason?: string } {
  const lowerMsg = userMessage.toLowerCase();

  // 1. Urgent security incident detection (checked first)
  if (
    lowerMsg.includes("root compromised") ||
    lowerMsg.includes("ransomware") ||
    lowerMsg.includes("hacked") ||
    lowerMsg.includes("data leak") ||
    lowerMsg.includes("compromised")
  ) {
    return {
      shouldEscalate: true,
      reason: "Urgent security incident detected in customer report.",
    };
  }

  // 2. Explicit human request
  for (const phrase of HUMAN_ESCALATION_PHRASES) {
    if (lowerMsg.includes(phrase)) {
      return {
        shouldEscalate: true,
        reason: `Customer explicitly requested human assistance: "${phrase}"`,
      };
    }
  }

  // 3. Repeated frustration or failure detection (3+ messages where customer indicates failure)
  const failureKeywords = ["still not working", "failed again", "doesn't work", "didn't work", "not helping", "useless"];
  let consecutiveFailures = 0;

  for (const m of history) {
    if (m.role === "user") {
      const text = m.content.toLowerCase();
      if (failureKeywords.some((k) => text.includes(k))) {
        consecutiveFailures++;
      }
    }
  }

  if (failureKeywords.some((k) => lowerMsg.includes(k))) {
    consecutiveFailures++;
  }

  if (consecutiveFailures >= 2) {
    return {
      shouldEscalate: true,
      reason: "Troubleshooting steps unresolved after multiple customer attempts.",
    };
  }

  return { shouldEscalate: false };
}

/**
 * Search the Knowledge Base for relevant articles based on keywords and tags
 */
export async function searchKnowledgeBase(query: string) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const allArticles = await prisma.knowledgeBaseArticle.findMany({
    where: { isPublished: true },
  });

  const scored = allArticles.map((article) => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const keywordsLower = article.keywords.toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) score += 5;
      if (keywordsLower.includes(term)) score += 3;
      if (contentLower.includes(term)) score += 1;
    }

    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 2).map((s) => s.article);
}

/**
 * Fallback Rule-Based Technical Support Engine
 * Completely functional even if external AI provider is down or unconfigured
 */
function generateLocalFallbackResponse(
  userMessage: string,
  articles: Array<{ title: string; content: string }>
): string {
  const lower = userMessage.toLowerCase();

  // If relevant KB articles matched, deliver accurate, step-by-step guidance
  if (articles.length > 0) {
    const top = articles[0];
    return `Hello! Based on our official VPS documentation for **${top.title}**, here are recommended troubleshooting steps:

${top.content.slice(0, 750)}...

*(Note: Our team will never ask for your root password or private SSH keys. If these steps do not resolve your issue, reply here or click Escalate to reach our NetOps staff.)*`;
  }

  if (lower.includes("ssh") || lower.includes("port 22") || lower.includes("refused") || lower.includes("timed out")) {
    return `Hello! For SSH connection issues, please try the following diagnostic steps:
1. **Connection Refused**: Verify that the SSH daemon is running using your web VNC emergency console (\`sudo systemctl status sshd\`). If stopped, restart with \`sudo systemctl restart sshd\`.
2. **Connection Timed Out**: Check that port 22 is permitted in your firewall (\`sudo ufw status\` or \`sudo iptables -L -n\`). Ensure Fail2Ban has not temporarily blocked your local IP.
3. **Key Authentication**: Confirm your public key is added to \`~/.ssh/authorized_keys\` with 600 permissions.

Did you recently modify \`/etc/ssh/sshd_config\` or your server firewall?`;
  }

  if (lower.includes("ping") || lower.includes("packet loss") || lower.includes("latency") || lower.includes("mtr")) {
    return `For latency or packet loss diagnostics:
1. Run a 100-cycle MTR test from your client machine to your VPS IP:
   \`mtr --report --report-cycles 100 <server-ip>\` (Linux/macOS) or using WinMTR (Windows).
2. Check whether loss appears on intermediate transit hops or exclusively at the destination.
3. If packet loss persists, please paste your MTR output here so our NetOps team can inspect upstream carrier routing.`;
  }

  if (lower.includes("oom") || lower.includes("ram") || lower.includes("cpu") || lower.includes("freeze") || lower.includes("crash")) {
    return `To troubleshoot resource spikes and unexpected service terminations:
1. Check kernel OOM killer logs:
   \`sudo dmesg -T | grep -i -E "oom|killed process"\`
2. Inspect active processes and resource consumption:
   \`htop\` or \`top -o %MEM\`
3. Check available swap space with \`free -h\`.
If you require additional dedicated RAM or vCPU cores, you can check upgrade pricing using \`/calc vps\` or request staff assistance.`;
  }

  return `Thank you for contacting Apex VPS Support. I've received your query regarding your VPS instance.
Could you please share:
1. Your server operating system (e.g. Ubuntu 22.04, Debian 12, AlmaLinux 9, Windows Server)?
2. The exact error message or command output you encountered?
3. Whether your instance responds to ping or web VNC console access?

*(Apex Support Reminder: Never share private SSH keys, passwords, or credit card details.)*`;
}

/**
 * Main AI Support Provider Dispatcher
 */
export async function generateSupportResponse(
  userMessage: string,
  conversationHistory: AiChatMessage[] = []
): Promise<AiResponseResult> {
  // 1. Check escalation triggers first
  const escalation = checkEscalationTriggers(userMessage, conversationHistory);

  // 2. Retrieve relevant approved KB articles
  const matchedArticles = await searchKnowledgeBase(userMessage);

  // 3. Load AI Config from database
  const aiConfig = await prisma.aiConfig.findFirst();
  const provider = aiConfig?.provider || "LOCAL_FALLBACK";

  // Check token limits
  if (aiConfig && aiConfig.tokensUsedThisMonth >= aiConfig.monthlyTokenLimit) {
    // Gracefully fall back to local rule engine when token limit is exceeded
    const fallbackReply = generateLocalFallbackResponse(userMessage, matchedArticles);
    return {
      reply: fallbackReply,
      sourceArticles: matchedArticles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
      shouldEscalate: escalation.shouldEscalate,
      escalationReason: escalation.reason,
      usedProvider: "LOCAL_FALLBACK (Token Limit Reached)",
      tokensUsed: 0,
    };
  }

  // If escalation triggered, prioritize staff handoff notice
  if (escalation.shouldEscalate) {
    return {
      reply: `I understand. I am escalating this ticket immediately to our dedicated Technical Support Staff.
A staff member will review your conversation history and respond shortly. Please remain in this channel.`,
      sourceArticles: matchedArticles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
      shouldEscalate: true,
      escalationReason: escalation.reason,
      usedProvider: provider,
      tokensUsed: 0,
    };
  }

  // 4. Try External Provider if configured (Gemini / OpenAI / Anthropic)
  if (provider === "GEMINI" && process.env.GEMINI_API_KEY) {
    try {
      const kbContext = matchedArticles
        .slice(0, 2)
        .map((a) => `[DOCUMENT: ${a.title}]\n${a.content}`)
        .join("\n\n");

      const systemPrompt = `${aiConfig?.systemPrompt || ""}\n\nAPPROVED KNOWLEDGE BASE:\n${kbContext}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig?.modelName || "gemini-1.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\n\nCustomer question: ${userMessage}` }] },
            ],
            generationConfig: {
              temperature: aiConfig?.temperature || 0.2,
              maxOutputTokens: aiConfig?.maxTokens || 1024,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Increment token count
          await prisma.aiConfig.updateMany({
            data: { tokensUsedThisMonth: { increment: 350 } },
          });

          return {
            reply: text,
            sourceArticles: matchedArticles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
            shouldEscalate: false,
            usedProvider: "GEMINI",
            tokensUsed: 350,
          };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local engine:", err);
    }
  }

  // 5. Default/Graceful Fallback Engine
  const reply = generateLocalFallbackResponse(userMessage, matchedArticles);

  return {
    reply,
    sourceArticles: matchedArticles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
    shouldEscalate: escalation.shouldEscalate,
    escalationReason: escalation.reason,
    usedProvider: "LOCAL_FALLBACK",
    tokensUsed: 0,
  };
}
