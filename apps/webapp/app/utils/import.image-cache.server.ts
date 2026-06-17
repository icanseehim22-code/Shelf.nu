import type { LRUCache } from "lru-cache";
import { getSupabaseAdmin } from "~/integrations/supabase/client";
import { isLikeEstoqueSoftSystemError, EstoqueSoftSystemError } from "./error";
import { Logger } from "./logger";

// 100MB total cache size for the import operation
export const MAX_CACHE_SIZE = 100 * 1024 * 1024;

export type CachedImage = {
  buffer: Buffer;
  contentType: string;
  size: number;
};

/**
 * Downloads and caches the Supabase-optimized version of an image
 * @param path - Supabase storage path of the uploaded image
 * @param cache - LRU cache instance for storing optimized images
 * @returns Cached image data or null if caching fails
 */
export async function cacheOptimizedImage(
  path: string,
  originalUrl: string,
  cache: LRUCache<string, CachedImage>
): Promise<CachedImage | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from("assets")
      .download(path);

    if (error || !data) {
      Logger.error(
        new EstoqueSoftSystemError({
          cause: error,
          message: "Failed to download optimized image from Supabase",
          additionalData: { path },
          label: "Image Cache",
        })
      );
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const image: CachedImage = {
      buffer,
      contentType: data.type,
      size: buffer.length,
    };

    // Only cache if it fits within memory limits
    if (image.size <= MAX_CACHE_SIZE - (cache.size || 0)) {
      cache.set(originalUrl, image);
    }

    return image;
  } catch (cause) {
    const isEstoqueSoftSystemError = isLikeEstoqueSoftSystemError(cause);
    Logger.error(
      new EstoqueSoftSystemError({
        cause,
        message: isEstoqueSoftSystemError
          ? cause.message
          : "Failed to cache optimized image",
        additionalData: { path },
        label: "Image Cache",
      })
    );
    return null;
  }
}
