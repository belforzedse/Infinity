import { safeJsonLd } from "@/utils/seo";

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  estimatedCost?: {
    currency: string;
    value: string;
  };
}

export function HowToSchema({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
}: HowToSchemaProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, index) => {
      const stepSchema: Record<string, any> = {
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      };

      if (step.image) {
        stepSchema.image = step.image.startsWith("http")
          ? step.image
          : `${SITE_URL}${step.image}`;
      }

      if (step.url) {
        stepSchema.url = step.url.startsWith("http") ? step.url : `${SITE_URL}${step.url}`;
      }

      return stepSchema;
    }),
  };

  if (totalTime) {
    schema.totalTime = totalTime;
  }

  if (estimatedCost) {
    schema.estimatedCost = {
      "@type": "MonetaryAmount",
      currency: estimatedCost.currency,
      value: estimatedCost.value,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}



