import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
    return NextResponse.json({ error: "Forbidden: Admin or Support Lead required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const targetType = searchParams.get("targetType");
  const search = searchParams.get("search");

  const whereClause: any = {};
  if (action && action !== "ALL") whereClause.action = action;
  if (targetType && targetType !== "ALL") whereClause.targetType = targetType;
  if (search) {
    whereClause.OR = [
      { actorUsername: { contains: search } },
      { action: { contains: search } },
      { details: { contains: search } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ logs });
}
