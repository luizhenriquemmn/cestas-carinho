import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ id: admin.id, email: admin.email });
}
