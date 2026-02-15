export default ({ env }) => {
  const restCacheProviderName = env("REST_CACHE_PROVIDER", "memory").toLowerCase();
  const redisConnectionName = env("REST_CACHE_REDIS_CONNECTION", "default");
  const redisUrl = env("REDIS_URL", "redis://localhost:6379");
  let redisHost = env("REDIS_HOST", "localhost");
  let redisPort = env.int("REDIS_PORT", 6379);
  let redisDb = env.int("REDIS_CACHE_DB", env.int("REDIS_DB", 0));
  let redisPassword = env("REDIS_PASSWORD", "");

  try {
    const parsed = new URL(redisUrl);
    if (parsed.hostname) redisHost = parsed.hostname;
    if (parsed.port) {
      const parsedPort = Number(parsed.port);
      if (Number.isFinite(parsedPort) && parsedPort > 0) redisPort = parsedPort;
    }
    const pathDb = parsed.pathname?.replace("/", "");
    if (pathDb) {
      const parsedDb = Number(pathDb);
      if (Number.isInteger(parsedDb) && parsedDb >= 0) redisDb = parsedDb;
    }
    if (parsed.password) redisPassword = decodeURIComponent(parsed.password);
  } catch {
    // Ignore URL parsing errors and use fallback env values.
  }

  const redisConnection: Record<string, string | number> = {
    host: redisHost,
    port: redisPort,
    db: redisDb,
  };
  if (redisPassword) {
    redisConnection.password = redisPassword;
  }

  const restCacheProviderOptions =
    restCacheProviderName === "redis"
      ? {
          connection: redisConnectionName,
        }
      : {
          max: 100000, // max cache entries (LRU)
          ttl: 5 * 60, // default TTL in seconds for store (per-response TTL is strategy.maxAge in ms)
        };

  return {
    documentation: {
      // The documentation plugin writes generated JSON into /src on startup.
      // Disable by default in production to avoid filesystem permission issues.
      enabled: env.bool("STRAPI_ENABLE_DOCUMENTATION", env("NODE_ENV") !== "production"),
    },
    redis: {
      config: {
        connections: {
          default: {
            connection: redisConnection,
            settings: {
              debug: false,
            },
          },
        },
      },
    },
    "rest-cache": {
      config: {
        provider: {
          name: restCacheProviderName,
          getTimeout: 100,
          options: restCacheProviderOptions,
        },
        strategy: {
          maxAge: 5 * 60 * 1000, // 5 min TTL per cached response (plugin default is 1h)
          contentTypes: [
            // Semi-dynamic: 5 min TTL, invalidate on content update
            "api::footer.footer",
            "api::navigation.navigation",
            "api::product-category.product-category",
            "api::product-category-content.product-category-content",
            "api::product-size-helper.product-size-helper",
            "api::product-tag.product-tag",
            "api::product-variation-color.product-variation-color",
            "api::product-variation-model.product-variation-model",
            "api::product-variation-size.product-variation-size",
            "api::shipping.shipping",
            "api::shipping-city.shipping-city",
            "api::shipping-province.shipping-province",
            "api::product.product",
            "api::product-variation.product-variation",
            "api::product-faq.product-faq",
            "api::product-review.product-review",
            "api::product-review-like.product-review-like",
            "api::product-review-reply.product-review-reply",
            "api::discount.discount",
            "api::general-discount.general-discount",
            "api::settings.settings",
            "api::blog-category.blog-category",
            "api::blog-tag.blog-tag",
            "api::blog-author.blog-author",
            "api::faq-category.faq-category",
            "api::faq-question.faq-question",
          ],
          // Not cached: cart, order, stock, wallet, address, transactions (real-time)
        },
      },
    },
    "users-permissions": {
      config: {
        jwt: {
          expiresIn: "7d", // JWT token expiry (changed from default 30d to 7d)
        },
      },
    },
    upload: {
      config: {
        providerOptions: {
          local: {
            sizeLimit: 0,
          },
        },
      },
    },
  };
};
