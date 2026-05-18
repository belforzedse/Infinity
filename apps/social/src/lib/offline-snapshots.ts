"use client";

import type { HomeFeedPost } from "@/services/feed-post.service";
import type { PostDetail } from "@/services/post-detail.service";

const DB_NAME = "infinitygram-offline";
const DB_VERSION = 1;
const SNAPSHOT_STORE = "snapshots";
const POST_STORE = "posts";
const FEED_KEY = "home-feed";
const MAX_POST_SNAPSHOTS = 24;
const COMMENT_DRAFT_PREFIX = "social-comment-draft:";

export type HomeFeedSnapshot = {
  id: typeof FEED_KEY;
  posts: HomeFeedPost[];
  updatedAt: number;
};

export type PostSnapshot = {
  slug: string;
  post: PostDetail;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(POST_STORE)) {
        const store = db.createObjectStore(POST_STORE, { keyPath: "slug" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = run(store);

    if (request) {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    } else {
      tx.oncomplete = () => resolve(undefined);
    }

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    tx.oncomplete = () => {
      if (!request) resolve(undefined);
    };
  }).finally(() => db.close());
}

export async function saveHomeFeedSnapshot(posts: readonly HomeFeedPost[]) {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const value: HomeFeedSnapshot = {
    id: FEED_KEY,
    posts: [...posts],
    updatedAt: Date.now(),
  };
  await withStore(SNAPSHOT_STORE, "readwrite", (store) => store.put(value));
}

export async function getHomeFeedSnapshot(): Promise<HomeFeedSnapshot | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  const value = await withStore<HomeFeedSnapshot>(SNAPSHOT_STORE, "readonly", (store) =>
    store.get(FEED_KEY),
  );
  return value ?? null;
}

export async function savePostSnapshot(post: PostDetail) {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const snapshot: PostSnapshot = {
    slug: post.slug,
    post,
    updatedAt: Date.now(),
  };
  await withStore(POST_STORE, "readwrite", (store) => store.put(snapshot));
  await trimPostSnapshots();
}

export async function getPostSnapshot(slug: string): Promise<PostSnapshot | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  const value = await withStore<PostSnapshot>(POST_STORE, "readonly", (store) => store.get(slug));
  return value ?? null;
}

async function trimPostSnapshots() {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(POST_STORE, "readwrite");
    const store = tx.objectStore(POST_STORE);
    const index = store.index("updatedAt");
    const request = index.openCursor();
    const keys: IDBValidKey[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      keys.push(cursor.primaryKey);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      if (keys.length <= MAX_POST_SNAPSHOTS) {
        resolve();
        return;
      }

      const cleanupTx = db.transaction(POST_STORE, "readwrite");
      const cleanupStore = cleanupTx.objectStore(POST_STORE);
      keys.slice(0, keys.length - MAX_POST_SNAPSHOTS).forEach((key) => cleanupStore.delete(key));
      cleanupTx.oncomplete = () => resolve();
      cleanupTx.onerror = () => reject(cleanupTx.error);
    };
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}

function draftKey(postId: string) {
  return `${COMMENT_DRAFT_PREFIX}${postId}`;
}

export function readCommentDraft(postId: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(draftKey(postId)) ?? "";
}

export function saveCommentDraft(postId: string, value: string) {
  if (typeof window === "undefined") return;
  if (!value.trim()) {
    window.localStorage.removeItem(draftKey(postId));
    return;
  }
  window.localStorage.setItem(draftKey(postId), value);
}

export function clearCommentDraft(postId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(postId));
}

export function clearAllCommentDrafts() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(COMMENT_DRAFT_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}
