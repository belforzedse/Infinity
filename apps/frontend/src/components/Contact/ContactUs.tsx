import type {
  IdentityContactNumber,
  IdentitySocialLink,
} from "@/types/site-identity";
import { platformLabel, SocialPlatformIcon } from "@/utils/identityIcons";

/** Bespoke brand circular icons kept for the common contact channels. */
const PhoneIcon = () => (
  <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12C24 18.6275 18.6275 24 12 24C5.37246 24 0 18.6275 0 12C0 5.37246 5.37246 0 12 0C18.6275 0 24 5.37246 24 12Z" fill="#3d4c6e" />
    <path d="M13.7889 14.0361L13.9911 13.8339C14.2154 13.6096 14.5389 13.5164 14.8481 13.5868C16.046 13.8593 17.1948 14.2753 17.8404 14.528C18.1689 14.6565 18.3603 14.9992 18.2978 15.3461C18.2915 15.3803 18.2853 15.4143 18.2786 15.4482L13.7889 14.0361Z" fill="white" />
    <path d="M9.75638 10.0037L9.95857 9.80155C10.1829 9.57724 10.276 9.25375 10.2057 8.94455C9.9331 7.74662 9.51711 6.59785 9.26443 5.9522C9.13597 5.62378 8.79326 5.43232 8.44631 5.49488C8.41212 5.50113 8.37817 5.50739 8.34421 5.51409L9.75638 10.0037Z" fill="white" />
    <path d="M18.2117 15.7581C18.0971 16.2427 17.9472 16.6864 17.8277 17.0058C17.7059 17.3311 17.4202 17.5668 17.0775 17.6242C15.7238 17.8503 12.097 18.0749 8.90715 14.8852C5.71731 11.6954 5.94183 8.06856 6.16815 6.71492C6.22556 6.37221 6.46104 6.08647 6.78655 5.96471C7.10602 5.84518 7.54971 5.69527 8.03429 5.58067L9.50455 10.2551L9.10845 10.6512C8.92324 10.8364 8.87945 11.1215 9.00255 11.3527C9.20406 11.7318 9.63145 12.3676 10.528 13.2642C11.4243 14.1605 12.0604 14.5881 12.4395 14.7896C12.6709 14.9127 12.9558 14.8689 13.141 14.6837L13.5371 14.2876L18.2115 15.7579L18.2117 15.7581Z" fill="white" />
  </svg>
);

const WhatsappIcon = () => (
  <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12C24 18.6275 18.6275 24 12 24C5.37246 24 0 18.6275 0 12C0 5.37246 5.37246 0 12 0C18.6275 0 24 5.37246 24 12Z" fill="#3d4c6e" />
    <path d="M11.9571 4.31127C8.24864 4.43146 5.18523 7.43509 4.9998 11.1411C4.93276 12.4772 5.22751 13.7401 5.80069 14.8363L4.99557 18.4421C4.96175 18.6052 5.1061 18.7496 5.26918 18.7157L8.87498 17.9106H8.87739C9.96638 18.4796 11.216 18.7743 12.5424 18.7127C16.2424 18.5412 19.2557 15.5013 19.3988 11.8001C19.5607 7.60843 16.1439 4.17537 11.9577 4.31127H11.9571ZM12.1969 17.2299C11.1484 17.2299 10.1663 16.9467 9.32192 16.452C9.2422 16.4073 9.16549 16.3602 9.0906 16.3101L6.787 16.9237L7.40065 14.6201C6.81901 13.7256 6.48138 12.6596 6.48138 11.5138C6.48138 8.36281 9.04591 5.79828 12.1969 5.79828C15.3479 5.79828 17.9124 8.36281 17.9124 11.5138C17.9124 14.6648 15.3479 17.2293 12.1969 17.2293V17.2299Z" fill="white" />
    <path d="M15.5865 14.03C15.4868 14.1798 15.3823 14.3193 15.215 14.486C14.849 14.852 14.3405 15.0368 13.8246 14.9843C12.9005 14.8895 11.5875 14.3791 10.4586 13.2527C9.32978 12.1238 8.81941 10.8107 8.727 9.88664C8.67446 9.37083 8.85928 8.86288 9.22529 8.49626C9.39199 8.32956 9.53152 8.22447 9.6813 8.1224C9.95793 7.93576 10.3342 8.06018 10.4387 8.37425L10.8174 9.51035C10.9219 9.82201 10.8748 10.0189 10.7401 10.1506L10.4387 10.455C10.2889 10.6048 10.2641 10.8361 10.3789 11.0155C10.5456 11.277 10.8597 11.6956 11.4377 12.2736C12.0157 12.8516 12.4343 13.1657 12.6958 13.3324C12.8752 13.4471 13.1071 13.4224 13.2563 13.2726L13.5607 12.9712C13.693 12.8365 13.8899 12.7894 14.2009 12.8939L15.337 13.2726C15.6511 13.3771 15.7755 13.7534 15.5865 14.03Z" fill="white" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12C24 18.6275 18.6275 24 12 24C5.37246 24 0 18.6275 0 12C0 5.37246 5.37246 0 12 0C18.6275 0 24 5.37246 24 12Z" fill="#3d4c6e" />
    <path d="M15.2561 5.70523H8.7445C7.06663 5.70523 5.70584 7.06601 5.70584 8.74389V15.2555C5.70584 16.9333 7.06663 18.2941 8.7445 18.2941H15.2561C16.9339 18.2941 18.2947 16.9333 18.2947 15.2555V8.74389C18.2947 7.06601 16.9339 5.70523 15.2561 5.70523ZM17.2094 15.038C17.2094 16.2363 16.2369 17.2088 15.0386 17.2088H8.96133C7.76302 17.2088 6.79061 16.2363 6.79061 15.038V8.96072C6.79061 7.76241 7.76302 6.78999 8.96133 6.78999H15.0386C16.2369 6.78999 17.2094 7.76241 17.2094 8.96072V15.038Z" fill="white" />
    <path d="M12.0067 8.74393C10.2098 8.74393 8.75119 10.2026 8.75119 11.9994C8.75119 13.7963 10.2098 15.2549 12.0067 15.2549C13.8035 15.2549 15.2622 13.7963 15.2622 11.9994C15.2622 10.2026 13.8035 8.74393 12.0067 8.74393ZM12.0067 14.1701C10.8108 14.1701 9.83595 13.1953 9.83595 11.9994C9.83595 10.8035 10.8108 9.82869 12.0067 9.82869C13.2026 9.82869 14.1774 10.8035 14.1774 11.9994C14.1774 13.1953 13.2026 14.1701 12.0067 14.1701Z" fill="white" />
    <path d="M15.4796 9.17819C15.8392 9.17819 16.1307 8.88668 16.1307 8.52709C16.1307 8.1675 15.8392 7.87599 15.4796 7.87599C15.12 7.87599 14.8285 8.1675 14.8285 8.52709C14.8285 8.88668 15.12 9.17819 15.4796 9.17819Z" fill="white" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12C24 18.6275 18.6275 24 12 24C5.37246 24 0 18.6275 0 12C0 5.37246 5.37246 0 12 0C18.6275 0 24 5.37246 24 12Z" fill="#3d4c6e" />
    <path d="M9.1214 19.3837C9.35515 19.1657 10.33 18.157 10.8434 16.066L11.2305 14.4763C11.5935 14.8544 12.0978 15.1069 12.6294 15.2361C14.7789 15.7652 16.8603 13.4683 17.4014 11.2601C18.1613 8.1695 16.5837 5.4425 13.9696 4.80288C10.9593 4.06481 7.40789 5.53491 6.54057 9.06762C6.23616 10.31 6.33763 12.1884 8.02275 13.0835C8.19489 13.1759 8.40689 13.0805 8.4534 12.8896L8.69016 11.9335C8.71492 11.823 8.67143 11.7089 8.58567 11.6322C7.98591 11.088 7.84759 10.1995 8.05053 9.366C8.63761 6.97663 11.0946 5.99575 13.1856 6.50914C15 6.95488 16.1035 8.8061 15.5901 10.8971C15.2241 12.3914 14.1876 14.0366 12.6934 13.6706C11.7983 13.4526 11.6968 12.5762 11.9402 11.5856L12.4874 9.34727C12.6288 8.76925 12.2754 8.1852 11.7004 8.04326C11.1224 7.90193 10.2092 8.31083 9.91685 9.50672C9.74472 10.2049 9.88605 10.7642 10.1506 11.1333L9.04953 15.6257C8.54218 17.695 8.92631 19.0328 9.04047 19.3523" fill="white" />
  </svg>
);

const GenericContactIcon = ({ platform }: { platform: IdentitySocialLink["platform"] }) => (
  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3d4c6e]">
    <SocialPlatformIcon platform={platform} size={14} className="!text-white" />
  </span>
);

function ContactNumberRow({ contact }: { contact: IdentityContactNumber }) {
  const Icon = contact.type === "whatsapp" ? WhatsappIcon : PhoneIcon;
  return (
    <div className="flex shrink-0 items-center">
      <Icon />
      <p className="mr-1 font-[Peyda(FaNum)] text-[12px] text-neutral-600 max-sm:text-[12px]" dir="ltr">
        {contact.number}
      </p>
    </div>
  );
}

function SocialRow({ social }: { social: IdentitySocialLink }) {
  const text = social.label || platformLabel(social.platform);
  let Icon: React.ReactNode;
  if (social.platform === "instagram") Icon = <InstagramIcon />;
  else if (social.platform === "telegram") Icon = <TelegramIcon />;
  else if (social.platform === "whatsapp") Icon = <WhatsappIcon />;
  else Icon = <GenericContactIcon platform={social.platform} />;

  return (
    <a href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80">
      {Icon}
      <p className="mr-1 font-[Peyda] text-[12px] text-neutral-600">{text}</p>
    </a>
  );
}

interface ContactUsProps {
  contactNumbers: IdentityContactNumber[];
  socialLinks: IdentitySocialLink[];
}

const ContactUs = ({ contactNumbers, socialLinks }: ContactUsProps) => {
  return (
    <div className="mt-3 rounded-xl bg-white px-4 py-3">
      <p className="mb-3 font-[Peyda(FaNum)] text-xl/[27.8px] font-normal text-neutral-900 max-md:text-center">
        ارتباط با ما
      </p>
      <div className="xs:grid-cols-2 inline-grid grid-cols-2 gap-x-6 gap-y-3">
        {contactNumbers.map((contact, index) => (
          <ContactNumberRow key={`contact-${index}`} contact={contact} />
        ))}
        {socialLinks.map((social, index) => (
          <SocialRow key={`social-${index}`} social={social} />
        ))}
      </div>
    </div>
  );
};

export default ContactUs;
