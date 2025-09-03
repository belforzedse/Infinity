import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const pairs: string[] = [];
    form.forEach((value, key) => {
      pairs.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
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

    // Otherwise, inspect payload to decide success/failure or missing order
    let json: any = null;
    try {
      json = await res.json();
    } catch {}

    if (res.ok) {
      const orderId = json?.data?.orderId || json?.orderId;
      return NextResponse.redirect(
        orderId ? `/orders/success?orderId=${orderId}` : "/orders/success",
        { status: 302 },
      );
    }

    // If backend reports invalid order id or anything else, go to failure (preserving error message if any)
    const errorMsg = encodeURIComponent(
      json?.error?.message || json?.data?.error || "payment_failed",
    );
    return NextResponse.redirect(`/orders/failure?error=${errorMsg}`, {
      status: 302,
    });
  } catch (err) {
    return NextResponse.redirect("/orders/failure", { status: 302 });
  }
}

export const dynamic = "force-dynamic";
