import { getStrapiServerUrl, IMAGE_BASE_URL } from "@repo/api/config";
import { getHomeDemoPosts, isSocialHomePostsDemoEnabled } from "@/components/posts/home-posts-demo";

export type PostDetailMedia = {
  id: string;
  url: string;
  alternativeText: string;
  mime?: string;
};

export type PostDetailComment = {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  isOfficialAuthor: boolean;
  createdAt: string;
  text: string;
  likesCount: number;
  replies: PostDetailComment[];
};

export type PostDetail = {
  id: string;
  slug: string;
  title: string;
  caption: string;
  productLink: string;
  media: PostDetailMedia[];
  likesCount: number;
  commentsCount: number;
  comments: PostDetailComment[];
};

type InternalPostDetailComment = Omit<PostDetailComment, "replies"> & {
  parentId: string | null;
  replies: InternalPostDetailComment[];
};

type StrapiMediaAttrs = {
  id?: number | string;
  url?: string;
  alternativeText?: string;
  mime?: string;
};

function readAttrs(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") return {};
  const r = entry as Record<string, unknown>;
  const inner = r.attributes;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return r;
}

function strapiMediaUrl(relativeOrAbsolute: string | undefined): string | null {
  if (!relativeOrAbsolute?.trim()) return null;
  const u = relativeOrAbsolute.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function normalizeMediaEntry(entry: unknown): StrapiMediaAttrs | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const attrs = readAttrs(entry);
  const id = root.id ?? attrs.id;
  return {
    id: typeof id === "number" || typeof id === "string" ? id : undefined,
    url: typeof attrs.url === "string" ? attrs.url : undefined,
    alternativeText: typeof attrs.alternativeText === "string" ? attrs.alternativeText : undefined,
    mime: typeof attrs.mime === "string" ? attrs.mime : undefined,
  };
}

function normalizeSingleMedia(raw: unknown): StrapiMediaAttrs | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return normalizeMediaEntry(r.data ?? raw);
}

function normalizeMediaList(raw: unknown): StrapiMediaAttrs[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (Array.isArray(data)) return data.map(normalizeMediaEntry).filter(Boolean) as StrapiMediaAttrs[];
  if (Array.isArray(raw)) return raw.map(normalizeMediaEntry).filter(Boolean) as StrapiMediaAttrs[];
  const one = normalizeMediaEntry(data ?? raw);
  return one ? [one] : [];
}

function relationTotal(raw: unknown): number {
  if (raw == null || typeof raw !== "object") return 0;
  const r = raw as Record<string, unknown>;
  if (typeof r.count === "number") return r.count;
  const meta = r.meta as Record<string, unknown> | undefined;
  if (typeof meta?.count === "number") return meta.count;
  const pagination = meta?.pagination as Record<string, unknown> | undefined;
  if (typeof pagination?.total === "number") return pagination.total;
  if (typeof pagination?.count === "number") return pagination.count;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const dataAttrs = (data as Record<string, unknown>).attributes as
      | Record<string, unknown>
      | undefined;
    if (typeof dataAttrs?.count === "number") return dataAttrs.count;
    if (typeof (data as Record<string, unknown>).count === "number") {
      return (data as Record<string, number>).count;
    }
  }
  if (Array.isArray(data)) return data.length;
  return 0;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&zwnj;/g, "‌")
    .replace(/\s+/g, " ")
    .trim();
}

function relationId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "number" || typeof raw === "string") return String(raw);
  if (typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object") return relationId(data);
  const id = r.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : null;
}

function userAvatar(rawUser: unknown): string | null {
  const attrs = readAttrs(rawUser);
  const info = attrs.user_info;
  const infoAttrs = readAttrs(info);
  const avatar = normalizeSingleMedia(infoAttrs.Avatar);
  return strapiMediaUrl(avatar?.url);
}

function commentAuthor(attrs: Record<string, unknown>): string {
  const name = typeof attrs.Name === "string" ? attrs.Name.trim() : "";
  if (name) return name;
  const userAttrs = readAttrs(attrs.user);
  const infoAttrs = readAttrs(userAttrs.user_info);
  const firstName = typeof infoAttrs.FirstName === "string" ? infoAttrs.FirstName.trim() : "";
  const lastName = typeof infoAttrs.LastName === "string" ? infoAttrs.LastName.trim() : "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (typeof userAttrs.username === "string" && userAttrs.username.trim()) return userAttrs.username.trim();
  return "کاربر اینفینیتی";
}

function normalizeComment(entry: unknown): InternalPostDetailComment | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const attrs = readAttrs(entry);
  const id = root.id ?? attrs.id;
  if (typeof id !== "number" && typeof id !== "string") return null;
  const text = typeof attrs.Content === "string" ? attrs.Content.trim() : "";
  if (!text) return null;

  const createdAt =
    typeof attrs.Date === "string"
      ? attrs.Date
      : typeof attrs.createdAt === "string"
        ? attrs.createdAt
        : new Date().toISOString();
  const isOfficialAuthor = attrs.IsInfinity === true;

  return {
    id: String(id),
    authorName: isOfficialAuthor ? "اینفینیتی" : commentAuthor(attrs),
    authorAvatarUrl: isOfficialAuthor ? null : userAvatar(attrs.user),
    isOfficialAuthor,
    createdAt,
    text,
    likesCount: relationTotal(attrs.post_comment_likes),
    replies: [],
    parentId: relationId(attrs.parent_comment),
  };
}

function stripInternalParentId(comment: InternalPostDetailComment): PostDetailComment {
  return {
    id: comment.id,
    authorName: comment.authorName,
    authorAvatarUrl: comment.authorAvatarUrl,
    isOfficialAuthor: comment.isOfficialAuthor,
    createdAt: comment.createdAt,
    text: comment.text,
    likesCount: comment.likesCount,
    replies: comment.replies.map(stripInternalParentId),
  };
}

function groupComments(rows: unknown[]): PostDetailComment[] {
  const byId = new Map<string, InternalPostDetailComment>();
  rows.forEach((row) => {
    const comment = normalizeComment(row);
    if (comment) byId.set(comment.id, comment);
  });

  const roots: InternalPostDetailComment[] = [];
  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)?.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots.map(stripInternalParentId);
}

function postDetailQuery(slug: string): string {
  const p = new URLSearchParams();
  p.set("filters[Slug][$eq]", slug);
  p.set("fields[0]", "Title");
  p.set("fields[1]", "Slug");
  p.set("fields[2]", "Description");
  p.set("fields[3]", "ProductLink");
  p.set("populate[Media][fields][0]", "url");
  p.set("populate[Media][fields][1]", "alternativeText");
  p.set("populate[Media][fields][2]", "mime");
  p.set("populate[post_likes][count]", "true");
  p.set("populate[post_comments][count]", "true");
  p.set("pagination[pageSize]", "1");
  return p.toString();
}

function commentsQuery(): string {
  const p = new URLSearchParams();
  p.set("populate[user][populate][user_info][populate][Avatar][fields][0]", "url");
  p.set("populate[parent_comment]", "true");
  p.set("populate[post_comment_likes][count]", "true");
  return p.toString();
}

async function fetchJson(url: string): Promise<unknown | null> {
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  return res.json();
}

function normalizePostDetail(entry: unknown, comments: PostDetailComment[]): PostDetail | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const attrs = readAttrs(entry);
  const id = root.id ?? attrs.id;
  if (typeof id !== "number" && typeof id !== "string") return null;

  const mediaRows = normalizeMediaList(attrs.Media);
  const media: PostDetailMedia[] = [];
  const seenUrls = new Set<string>();

  mediaRows.forEach((item, index) => {
    const url = strapiMediaUrl(item.url);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    media.push({
      id: String(item.id ?? `${id}-${index}`),
      url,
      alternativeText: item.alternativeText?.trim() || "تصویر پست",
      mime: item.mime,
    });
  });

  const title = typeof attrs.Title === "string" ? attrs.Title.trim() : "";
  const rawDescription = typeof attrs.Description === "string" ? attrs.Description : "";
  const productLink = typeof attrs.ProductLink === "string" ? attrs.ProductLink.trim() : "";

  return {
    id: String(id),
    slug: typeof attrs.Slug === "string" ? attrs.Slug : "",
    title,
    caption: stripHtml(rawDescription) || title,
    productLink,
    media,
    likesCount: relationTotal(attrs.post_likes),
    commentsCount: Math.max(relationTotal(attrs.post_comments), comments.length),
    comments,
  };
}

function demoComments(): PostDetailComment[] {
  return [
    {
      id: "demo-comment-1",
      authorName: "مارال آذری",
      authorAvatarUrl: null,
      isOfficialAuthor: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      text: "عاشقشم خیلی خوشگله",
      likesCount: 3,
      replies: [],
    },
    {
      id: "demo-comment-2",
      authorName: "علی",
      authorAvatarUrl: null,
      isOfficialAuthor: false,
      createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      text: "مرسی ازتون بابت عکس‌ها رو چجوری برای هم ارسال کنیم",
      likesCount: 2,
      replies: [
        {
          id: "demo-reply-1",
          authorName: "اینفینیتی",
          authorAvatarUrl: null,
          isOfficialAuthor: true,
          createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          text: "از گزینه ارسال دیدگاه می‌تونید استفاده کنید.",
          likesCount: 0,
          replies: [],
        },
      ],
    },
  ];
}

function getDemoPostDetail(slug: string): PostDetail | null {
  const post = getHomeDemoPosts().find((item) => item.slug === slug);
  if (!post) return null;
  const media = post.media.map((item, index) => ({
    url: item.url,
    id: `${post.id}-${index}`,
    alternativeText: post.imageAlt,
    mime: "image/jpeg",
  }));
  const comments = demoComments();
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    caption: "اصالت در عین سادگی؛ انتخابی مینیمال برای استایل روزمره.",
    productLink: "",
    media,
    likesCount: post.likesCount,
    commentsCount: Math.max(post.commentsCount, comments.length),
    comments,
  };
}

export async function getPostDetailBySlug(slug: string): Promise<PostDetail | null> {
  if (isSocialHomePostsDemoEnabled()) return getDemoPostDetail(slug);

  const base = getStrapiServerUrl().replace(/\/$/, "");
  const postJson = await fetchJson(`${base}/posts?${postDetailQuery(slug)}`);
  const rows =
    postJson && typeof postJson === "object" && Array.isArray((postJson as { data?: unknown[] }).data)
      ? (postJson as { data: unknown[] }).data
      : [];
  const row = rows[0];
  if (!row || typeof row !== "object") return null;
  const id = (row as Record<string, unknown>).id;
  if (typeof id !== "number" && typeof id !== "string") return null;

  const commentsJson = await fetchJson(`${base}/post-comments/post/${id}?${commentsQuery()}`);
  const commentRows =
    commentsJson && typeof commentsJson === "object" && Array.isArray((commentsJson as { data?: unknown[] }).data)
      ? (commentsJson as { data: unknown[] }).data
      : [];

  return normalizePostDetail(row, groupComments(commentRows));
}
