import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-demand revalidation API route
 *
 * This endpoint allows Strapi to trigger Next.js cache revalidation
 * when blog posts are published, updated, or deleted.
 *
 * Usage from Strapi:
 * POST /api/revalidate
 * Headers: { "Authorization": "Bearer <secret>" }
 * Body: { "path": "/blog-post-slug", "type": "blog-post" }
 *
 * Security: Protected by REVALIDATION_SECRET token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization token
    const authHeader = request.headers.get("authorization");
    const secret = process.env.REVALIDATION_SECRET;

    if (!secret) {
      console.error("REVALIDATION_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== secret) {
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { path, type, tag } = body;

    if (!path && !tag) {
      return NextResponse.json(
        { error: "Missing 'path' or 'tag' in request body" },
        { status: 400 }
      );
    }

    // Revalidate based on type
    if (type === "blog-post" && path) {
      // Ensure path starts with / (blog post routes are at /[slug], not /blog/[slug])
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;

      // Revalidate the specific blog post page
      revalidatePath(normalizedPath);
      // Also revalidate the blog listing page
      revalidatePath("/blog");
      // Revalidate sitemap
      revalidatePath("/sitemap.xml");

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        paths: [normalizedPath, "/blog", "/sitemap.xml"],
      });
    }

    if (type === "product" && path) {
      // Product PDP route is /pdp/[slug]
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const pdpPath = normalizedPath.startsWith("/pdp/") ? normalizedPath : `/pdp${normalizedPath}`;

      // Revalidate the specific product PDP page
      revalidatePath(pdpPath);
      // Also revalidate PLP and sitemap
      revalidatePath("/plp");
      revalidatePath("/sitemap.xml");

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        paths: [pdpPath, "/plp", "/sitemap.xml"],
      });
    }

    if (type === "blog-listing") {
      // Revalidate blog listing and sitemap
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        paths: ["/blog", "/sitemap.xml"],
      });
    }

    // Generic path revalidation
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        path,
      });
    }

    // Tag-based revalidation
    if (tag) {
      revalidateTag(tag, "max");
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        tag,
      });
    }

    return NextResponse.json(
      { error: "Invalid revalidation request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Error revalidating", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Disable caching for this route
export const dynamic = "force-dynamic";

