import { NextResponse } from 'next/server';
import { blogService } from '@/services/blog/blog.service';
import { IMAGE_BASE_URL } from '@/constants/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://infinitycolor.org';
const SITE_NAME = 'اینفینیتی استور';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    // Fetch published blog posts
    const response = await blogService.getBlogPosts({
      pageSize: 20,
      status: 'Published',
      sort: 'PublishedAt:desc',
      search,
    });

    const posts = response.data || [];

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_NAME} - وبلاگ</title>
    <link>${SITE_URL}/blog</link>
    <description>آخرین مقالات، آموزش‌ها و بینش‌های ${SITE_NAME}</description>
    <language>fa-IR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map((post) => {
        const imageUrl = post.FeaturedImage?.url
          ? `${IMAGE_BASE_URL}${post.FeaturedImage.url}`
          : undefined;
        const pubDate = post.PublishedAt
          ? new Date(post.PublishedAt).toUTCString()
          : new Date(post.createdAt).toUTCString();
        const excerpt = post.Excerpt || post.ShortContent || '';
        const content = post.Content || excerpt;
        const category = post.blog_category?.Name || 'عمومی';

        return `
    <item>
      <title><![CDATA[${post.Title}]]></title>
      <link>${SITE_URL}/${post.Slug}</link>
      <guid isPermaLink="true">${SITE_URL}/${post.Slug}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${category}]]></category>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}


