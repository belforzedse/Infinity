import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const pairs: string[] = [];
    form.forEach((value, key) => {
      pairs.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      );
    });
    const body = pairs.join("&");

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api.infinity.rgbgroup.ir/api";
    const url = `${apiBase.replace(/\/$/, "")}/orders/payment-callback`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      redirect: "manual",
    });

    // If backend responds with redirect, forward it
    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, { status: 302 });
    }

    // Otherwise, fallback: send to success/failure based on status
    if (res.ok) {
      return NextResponse.redirect("/orders/success", { status: 302 });
    } else {
      return NextResponse.redirect("/orders/failure", { status: 302 });
    }
  } catch (err) {
    return NextResponse.redirect("/orders/failure", { status: 302 });
  }
}

export const dynamic = "force-dynamic";
