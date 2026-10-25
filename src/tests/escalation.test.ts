import { describe, it, expect } from "vitest";
import { checkEscalationTriggers } from "../lib/ai";

describe("Staff Escalation Engine Triggers", () => {
  it("should trigger escalation when customer explicitly asks for human/staff", () => {
    const res1 = checkEscalationTriggers("Can I talk to a human agent please?");
    expect(res1.shouldEscalate).toBe(true);
    expect(res1.reason).toContain("explicitly requested human assistance");

    const res2 = checkEscalationTriggers("Please escalate to support team");
    expect(res2.shouldEscalate).toBe(true);
  });

  it("should trigger escalation on urgent security events", () => {
    const res = checkEscalationTriggers("I think someone hacked my server and changed the root credentials!");
    expect(res.shouldEscalate).toBe(true);
    expect(res.reason).toContain("Urgent security incident");
  });

  it("should trigger escalation when multiple consecutive troubleshooting attempts fail", () => {
    const history = [
      { role: "user" as const, content: "I ran the systemctl command and it's still not working." },
      { role: "assistant" as const, content: "Let's check the firewall rules next." },
    ];

    const currentMsg = "I checked ufw and it failed again, still not working!";
    const res = checkEscalationTriggers(currentMsg, history);
    expect(res.shouldEscalate).toBe(true);
    expect(res.reason).toContain("unresolved after multiple customer attempts");
  });

  it("should NOT escalate routine technical inquiries that AI can answer", () => {
    const res = checkEscalationTriggers("How do I allow port 22 in UFW on Ubuntu 22.04?");
    expect(res.shouldEscalate).toBe(false);
  });
});
