import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    // First user is admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "user";

    const user = await prisma.user.create({
      data: { email, name, hashedPassword, role },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    console.error("Register error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
