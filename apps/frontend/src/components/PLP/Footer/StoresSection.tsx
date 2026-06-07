import Image from "next/image";
import type {
  IdentityContactNumber,
  IdentitySocialLink,
  IdentityStore,
} from "@/types/site-identity";
import { contactIcon, platformLabel, SocialPlatformIcon, storeMapLinks } from "@/utils/identityIcons";

interface StoresSectionProps {
  stores: IdentityStore[];
  showStores: boolean;
  socialLinks: IdentitySocialLink[];
  contactNumbers: IdentityContactNumber[];
}

const StoresSection = ({
  stores,
  showStores,
  socialLinks,
  contactNumbers,
}: StoresSectionProps) => {
  const renderStores = showStores && stores.length > 0;

  return (
    <div className="relative flex flex-col gap-4 border-slate-200 md:h-full md:min-h-[324px] md:border-r md:px-4 lg:px-6">
      {renderStores && (
        <>
          <h3 className="text-base text-neutral-900">فروشگاه های حضوری</h3>

          {stores.map((store, index) => {
            const mapLinks = storeMapLinks(store);
            return (
              <div key={index} className="flex flex-col gap-2">
                {store.address && (
                  <p className="text-sm text-right text-neutral-500 md:max-w-[280px]">
                    {store.name ? `${store.name}: ${store.address}` : store.address}
                  </p>
                )}
                {mapLinks.length > 0 && (
                  <div className="flex gap-2">
                    {mapLinks.map((icon) => (
                      <a
                        key={icon.src}
                        href={icon.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-transform hover:scale-110"
                        aria-label={icon.alt}
                      >
                        <Image
                          src={icon.src}
                          alt={icon.alt}
                          width={24}
                          height={24}
                          className="rounded-full"
                          loading="lazy"
                          sizes="24px"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="my-2 h-[1px] w-full bg-slate-200" />
        </>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-base text-neutral-900">ارتباط با ما</h3>
        <div className="flex flex-col items-start gap-2">
          {contactNumbers.map((contact, index) => (
            <div key={`contact-${index}`} className="flex items-center justify-end gap-1">
              <Image
                src={contactIcon(contact.type)}
                alt={contact.label || "تماس"}
                width={16}
                height={16}
                loading="lazy"
                sizes="16px"
              />
              <span className="text-sm text-neutral-600" dir="ltr">
                {contact.number}
              </span>
            </div>
          ))}
          {socialLinks.map((social, index) => {
            const label = social.label || platformLabel(social.platform);
            return (
              <a
                key={`social-${index}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-end gap-1 hover:opacity-80"
                aria-label={label}
              >
                <SocialPlatformIcon platform={social.platform} size={16} />
                <span className="text-sm text-neutral-600">{label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoresSection;
