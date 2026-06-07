import type { Attribute, Schema } from "@strapi/strapi";

export interface FooterContactUs extends Schema.Component {
  collectionName: "components_footer_contactuses";
  info: {
    displayName: "ContactUs";
    icon: "apps";
  };
  attributes: {
    Instagram: Attribute.String;
    Phone: Attribute.String & Attribute.Required;
    Telegram: Attribute.String;
    Whatsapp: Attribute.String;
  };
}

export interface FooterFooterLinkItem extends Schema.Component {
  collectionName: "components_footer_footer_link_items";
  info: {
    displayName: "FooterLinkItem";
    icon: "bulletList";
  };
  attributes: {
    Title: Attribute.String & Attribute.Required;
    URL: Attribute.Text & Attribute.Required;
  };
}

export interface FooterFooterSection extends Schema.Component {
  collectionName: "components_footer_footer_sections";
  info: {
    displayName: "FooterSection";
    icon: "connector";
  };
  attributes: {
    Header: Attribute.String;
    Links: Attribute.Component<"footer.footer-link-item", true>;
  };
}

export interface IdentityContactNumber extends Schema.Component {
  collectionName: "components_identity_contact_numbers";
  info: {
    displayName: "ContactNumber";
    icon: "phone";
  };
  attributes: {
    label: Attribute.String;
    number: Attribute.String & Attribute.Required;
    type: Attribute.Enumeration<["phone", "mobile", "whatsapp"]>;
  };
}

export interface IdentityFaqCategory extends Schema.Component {
  collectionName: "components_identity_faq_categories";
  info: {
    displayName: "FaqCategory";
    icon: "bulletList";
  };
  attributes: {
    description: Attribute.Text;
    items: Attribute.Component<"identity.faq-item", true>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
    title: Attribute.String & Attribute.Required;
  };
}

export interface IdentityFaqItem extends Schema.Component {
  collectionName: "components_identity_faq_items";
  info: {
    displayName: "FaqItem";
    icon: "question";
  };
  attributes: {
    answer: Attribute.RichText & Attribute.Required;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
    question: Attribute.Text & Attribute.Required;
  };
}

export interface IdentityPhone extends Schema.Component {
  collectionName: "components_identity_phones";
  info: {
    displayName: "Phone";
    icon: "phone";
  };
  attributes: {
    label: Attribute.String;
    number: Attribute.String & Attribute.Required;
  };
}

export interface IdentitySocialLink extends Schema.Component {
  collectionName: "components_identity_social_links";
  info: {
    displayName: "SocialLink";
    icon: "link";
  };
  attributes: {
    label: Attribute.String;
    platform: Attribute.Enumeration<
      [
        "instagram",
        "telegram",
        "whatsapp",
        "bale",
        "x",
        "linkedin",
        "youtube",
        "aparat",
        "eitaa",
        "rubika",
        "other",
      ]
    > &
      Attribute.Required;
    url: Attribute.String & Attribute.Required;
  };
}

export interface IdentityStore extends Schema.Component {
  collectionName: "components_identity_stores";
  info: {
    displayName: "Store";
    icon: "store";
  };
  attributes: {
    address: Attribute.Text;
    baladLink: Attribute.String;
    googleMapsLink: Attribute.String;
    name: Attribute.String;
    neshanLink: Attribute.String;
    phones: Attribute.Component<"identity.phone", true>;
    showInAbout: Attribute.Boolean & Attribute.DefaultTo<false>;
    showInFooter: Attribute.Boolean & Attribute.DefaultTo<true>;
    socialLinks: Attribute.Component<"identity.social-link", true>;
    wazeLink: Attribute.String;
  };
}

declare module "@strapi/types" {
  export module Shared {
    export interface Components {
      "footer.contact-us": FooterContactUs;
      "footer.footer-link-item": FooterFooterLinkItem;
      "footer.footer-section": FooterFooterSection;
      "identity.contact-number": IdentityContactNumber;
      "identity.faq-category": IdentityFaqCategory;
      "identity.faq-item": IdentityFaqItem;
      "identity.phone": IdentityPhone;
      "identity.social-link": IdentitySocialLink;
      "identity.store": IdentityStore;
    }
  }
}
