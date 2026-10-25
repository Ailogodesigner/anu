import { prisma } from "./prisma";

export interface AuditEventParams {
  actorDiscordId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log a privileged or state-changing action to the persistent database audit log
 */
export async function logAuditEvent(params: AuditEventParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorDiscordId: params.actorDiscordId,
        actorUsername: params.actorUsername,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
