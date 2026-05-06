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

declare module "@strapi/types" {
  export module Shared {
    export interface Components {
      "footer.contact-us": FooterContactUs;
      "footer.footer-link-item": FooterFooterLinkItem;
      "footer.footer-section": FooterFooterSection;
    }
  }
}
