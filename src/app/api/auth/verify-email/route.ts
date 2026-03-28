import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", baseUrl)
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", baseUrl)
      );
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: hashedToken,
          },
        },
      });
      return NextResponse.redirect(
        new URL("/login?error=token_expired", baseUrl)
      );
    }

    // Mark user email as verified
    await prisma.user.updateMany({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: hashedToken,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/login?verified=true", baseUrl)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", baseUrl)
    );
  }
}
