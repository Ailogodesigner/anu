import { describe, it, expect } from "vitest";
import { hasRequiredRole, createSessionToken, verifySessionToken, StaffRole } from "../lib/auth";

describe("Role-Based Authorization & Session Security", () => {
  it("should enforce correct role hierarchy levels", () => {
    // ADMIN has access to everything
    expect(hasRequiredRole("ADMIN", ["SUPPORT_LEAD"])).toBe(true);
    expect(hasRequiredRole("ADMIN", ["SUPPORT_AGENT"])).toBe(true);
    expect(hasRequiredRole("ADMIN", ["VIEWER"])).toBe(true);

    // SUPPORT_LEAD has access to agent and viewer endpoints, but not admin
    expect(hasRequiredRole("SUPPORT_LEAD", ["ADMIN"])).toBe(false);
    expect(hasRequiredRole("SUPPORT_LEAD", ["SUPPORT_AGENT"])).toBe(true);

    // SUPPORT_AGENT cannot access lead or admin
    expect(hasRequiredRole("SUPPORT_AGENT", ["ADMIN"])).toBe(false);
    expect(hasRequiredRole("SUPPORT_AGENT", ["SUPPORT_LEAD"])).toBe(false);
    expect(hasRequiredRole("SUPPORT_AGENT", ["SUPPORT_AGENT"])).toBe(true);

    // VIEWER cannot access agent, lead, or admin
    expect(hasRequiredRole("VIEWER", ["SUPPORT_AGENT"])).toBe(false);
  });

  it("should create and verify signed JWT session tokens accurately", async () => {
    const user = {
      id: "usr_test_123",
      discordId: "123456789012345678",
      username: "DevOps_Dan",
      avatar: null,
      role: "SUPPORT_AGENT" as StaffRole,
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.discordId).toBe("123456789012345678");
    expect(decoded?.role).toBe("SUPPORT_AGENT");
  });
});
