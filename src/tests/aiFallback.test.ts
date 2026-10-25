import { describe, it, expect } from "vitest";
import { generateSupportResponse } from "../lib/ai";

describe("Provider-Independent AI Fallback & Guardrails", () => {
  it("should generate accurate SSH diagnostic steps when external AI provider is in fallback mode", async () => {
    const res = await generateSupportResponse("I'm getting port 22 connection refused on my server");
    expect(res.reply).toContain("sshd");
    expect(res.reply).toContain("VNC");
    expect(res.shouldEscalate).toBe(false);

    // Guardrail: must NEVER request password or private keys
    expect(res.reply.toLowerCase()).not.toContain("give me your password");
    expect(res.reply.toLowerCase()).not.toContain("send your private key");
  });

  it("should generate MTR packet loss diagnostic instructions", async () => {
    const res = await generateSupportResponse("Experiencing high latency and packet loss to my VPS");
    expect(res.reply.toLowerCase()).toContain("mtr");
    expect(res.reply.toLowerCase()).toContain("ping");
  });

  it("should identify OOM crashes and suggest dmesg inspect commands", async () => {
    const res = await generateSupportResponse("My node app crashed and system says Out of memory");
    expect(res.reply.toLowerCase()).toContain("oom");
    expect(res.reply).toContain("dmesg");
  });
});
