import type { Attribute, Schema } from "@strapi/strapi";

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: "strapi_api_tokens";
  info: {
    description: "";
    displayName: "Api Token";
    name: "Api Token";
    pluralName: "api-tokens";
    singularName: "api-token";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::api-token", "oneToOne", "admin::user"> &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<"">;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<"admin::api-token", "oneToMany", "admin::api-token-permission">;
    type: Attribute.Enumeration<["read-only", "full-access", "custom"]> &
      Attribute.Required &
      Attribute.DefaultTo<"read-only">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::api-token", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: "strapi_api_token_permissions";
  info: {
    description: "";
    displayName: "API Token Permission";
    name: "API Token Permission";
    pluralName: "api-token-permissions";
    singularName: "api-token-permission";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::api-token-permission", "oneToOne", "admin::user"> &
      Attribute.Private;
    token: Attribute.Relation<"admin::api-token-permission", "manyToOne", "admin::api-token">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::api-token-permission", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: "admin_permissions";
  info: {
    description: "";
    displayName: "Permission";
    name: "Permission";
    pluralName: "permissions";
    singularName: "permission";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::permission", "oneToOne", "admin::user"> &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<"admin::permission", "manyToOne", "admin::role">;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::permission", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: "admin_roles";
  info: {
    description: "";
    displayName: "Role";
    name: "Role";
    pluralName: "roles";
    singularName: "role";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::role", "oneToOne", "admin::user"> & Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<"admin::role", "oneToMany", "admin::permission">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::role", "oneToOne", "admin::user"> & Attribute.Private;
    users: Attribute.Relation<"admin::role", "manyToMany", "admin::user">;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: "strapi_transfer_tokens";
  info: {
    description: "";
    displayName: "Transfer Token";
    name: "Transfer Token";
    pluralName: "transfer-tokens";
    singularName: "transfer-token";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::transfer-token", "oneToOne", "admin::user"> &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<"">;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      "admin::transfer-token",
      "oneToMany",
      "admin::transfer-token-permission"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::transfer-token", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: "strapi_transfer_token_permissions";
  info: {
    description: "";
    displayName: "Transfer Token Permission";
    name: "Transfer Token Permission";
    pluralName: "transfer-token-permissions";
    singularName: "transfer-token-permission";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::transfer-token-permission", "oneToOne", "admin::user"> &
      Attribute.Private;
    token: Attribute.Relation<
      "admin::transfer-token-permission",
      "manyToOne",
      "admin::transfer-token"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::transfer-token-permission", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: "admin_users";
  info: {
    description: "";
    displayName: "User";
    name: "User";
    pluralName: "users";
    singularName: "user";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"admin::user", "oneToOne", "admin::user"> & Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<"admin::user", "manyToMany", "admin::role"> & Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"admin::user", "oneToOne", "admin::user"> & Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiAdminActivityAdminActivity extends Schema.CollectionType {
  collectionName: "admin_activities";
  info: {
    description: "Audit log for admin actions";
    displayName: "AdminActivity";
    pluralName: "admin-activities";
    singularName: "admin-activity";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<
      ["Create", "Update", "Delete", "Publish", "Unpublish", "Adjust", "Other"]
    > &
      Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::admin-activity.admin-activity", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    Message: Attribute.Text;
    MessageEn: Attribute.String;
    Metadata: Attribute.JSON;
    performed_by: Attribute.Relation<
      "api::admin-activity.admin-activity",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedByName: Attribute.String;
    PerformedByRole: Attribute.String;
    ResourceId: Attribute.String;
    ResourceType: Attribute.Enumeration<
      ["Order", "Product", "User", "Contract", "Discount", "Stock", "Other"]
    > &
      Attribute.Required;
    Severity: Attribute.Enumeration<["info", "success", "warning", "error"]> &
      Attribute.DefaultTo<"info">;
    Title: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::admin-activity.admin-activity", "oneToOne", "admin::user"> &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiBlogAuthorBlogAuthor extends Schema.CollectionType {
  collectionName: "blog_authors";
  info: {
    description: "Authors who can write blog posts";
    displayName: "Blog Author";
    pluralName: "blog-authors";
    singularName: "blog-author";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Avatar: Attribute.Media<"images">;
    Bio: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 1000;
      }>;
    blog_posts: Attribute.Relation<
      "api::blog-author.blog-author",
      "oneToMany",
      "api::blog-post.blog-post"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::blog-author.blog-author", "oneToOne", "admin::user"> &
      Attribute.Private;
    Email: Attribute.Email;
    local_user: Attribute.Relation<
      "api::blog-author.blog-author",
      "oneToOne",
      "api::local-user.local-user"
    >;
    Name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::blog-author.blog-author", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiBlogCategoryBlogCategory extends Schema.CollectionType {
  collectionName: "blog_categories";
  info: {
    description: "Categories for organizing blog posts";
    displayName: "Blog Category";
    pluralName: "blog-categories";
    singularName: "blog-category";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blog_posts: Attribute.Relation<
      "api::blog-category.blog-category",
      "oneToMany",
      "api::blog-post.blog-post"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::blog-category.blog-category", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    FeaturedImage: Attribute.Media<"images">;
    Slug: Attribute.UID<"api::blog-category.blog-category", "Title"> & Attribute.Required;
    Title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::blog-category.blog-category", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiBlogCommentBlogComment extends Schema.CollectionType {
  collectionName: "blog_comments";
  info: {
    description: "Comments on blog posts with moderation support";
    displayName: "Blog Comment";
    pluralName: "blog-comments";
    singularName: "blog-comment";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blog_post: Attribute.Relation<
      "api::blog-comment.blog-comment",
      "manyToOne",
      "api::blog-post.blog-post"
    >;
    Content: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 2000;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::blog-comment.blog-comment", "oneToOne", "admin::user"> &
      Attribute.Private;
    Date: Attribute.DateTime & Attribute.Required;
    parent_comment: Attribute.Relation<
      "api::blog-comment.blog-comment",
      "manyToOne",
      "api::blog-comment.blog-comment"
    >;
    replies: Attribute.Relation<
      "api::blog-comment.blog-comment",
      "oneToMany",
      "api::blog-comment.blog-comment"
    >;
    Status: Attribute.Enumeration<["Pending", "Approved", "Rejected"]> &
      Attribute.Required &
      Attribute.DefaultTo<"Pending">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::blog-comment.blog-comment", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<
      "api::blog-comment.blog-comment",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiBlogPostBlogPost extends Schema.CollectionType {
  collectionName: "blog_posts";
  info: {
    description: "Blog posts with rich content and SEO features";
    displayName: "Blog Post";
    pluralName: "blog-posts";
    singularName: "blog-post";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blog_author: Attribute.Relation<
      "api::blog-post.blog-post",
      "manyToOne",
      "api::blog-author.blog-author"
    >;
    blog_category: Attribute.Relation<
      "api::blog-post.blog-post",
      "manyToOne",
      "api::blog-category.blog-category"
    >;
    blog_comments: Attribute.Relation<
      "api::blog-post.blog-post",
      "oneToMany",
      "api::blog-comment.blog-comment"
    >;
    blog_tags: Attribute.Relation<
      "api::blog-post.blog-post",
      "manyToMany",
      "api::blog-tag.blog-tag"
    >;
    Content: Attribute.RichText & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::blog-post.blog-post", "oneToOne", "admin::user"> &
      Attribute.Private;
    Excerpt: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    FeaturedImage: Attribute.Media<"images">;
    Keywords: Attribute.Text;
    MetaDescription: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    MetaTitle: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    PublishedAt: Attribute.DateTime;
    Slug: Attribute.UID<"api::blog-post.blog-post", "Title"> & Attribute.Required;
    Status: Attribute.Enumeration<["Draft", "Published", "Scheduled"]> &
      Attribute.Required &
      Attribute.DefaultTo<"Draft">;
    Title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::blog-post.blog-post", "oneToOne", "admin::user"> &
      Attribute.Private;
    ViewCount: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface ApiBlogTagBlogTag extends Schema.CollectionType {
  collectionName: "blog_tags";
  info: {
    description: "Tags for categorizing and filtering blog posts";
    displayName: "Blog Tag";
    pluralName: "blog-tags";
    singularName: "blog-tag";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blog_posts: Attribute.Relation<
      "api::blog-tag.blog-tag",
      "manyToMany",
      "api::blog-post.blog-post"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::blog-tag.blog-tag", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    Slug: Attribute.UID<"api::blog-tag.blog-tag", "Name"> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::blog-tag.blog-tag", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiCartItemCartItem extends Schema.CollectionType {
  collectionName: "cart_items";
  info: {
    displayName: "CartItem";
    pluralName: "cart-items";
    singularName: "cart-item";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cart: Attribute.Relation<"api::cart-item.cart-item", "manyToOne", "api::cart.cart">;
    Count: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::cart-item.cart-item", "oneToOne", "admin::user"> &
      Attribute.Private;
    product_variation: Attribute.Relation<
      "api::cart-item.cart-item",
      "oneToOne",
      "api::product-variation.product-variation"
    >;
    Sum: Attribute.BigInteger &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      > &
      Attribute.DefaultTo<"0">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::cart-item.cart-item", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiCartCart extends Schema.CollectionType {
  collectionName: "carts";
  info: {
    description: "";
    displayName: "Cart";
    pluralName: "carts";
    singularName: "cart";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cart_items: Attribute.Relation<"api::cart.cart", "oneToMany", "api::cart-item.cart-item">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::cart.cart", "oneToOne", "admin::user"> & Attribute.Private;
    Status: Attribute.Enumeration<["Pending", "Payment", "Left", "Empty"]> &
      Attribute.DefaultTo<"Empty">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::cart.cart", "oneToOne", "admin::user"> & Attribute.Private;
    user: Attribute.Relation<"api::cart.cart", "oneToOne", "plugin::users-permissions.user">;
  };
}

export interface ApiContractLogContractLog extends Schema.CollectionType {
  collectionName: "contract_logs";
  info: {
    description: "Audit log for Contract entity";
    displayName: "ContractLog";
    pluralName: "contract-logs";
    singularName: "contract-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<["Create", "Update", "Delete"]> & Attribute.Required;
    Changes: Attribute.JSON;
    contract: Attribute.Relation<
      "api::contract-log.contract-log",
      "manyToOne",
      "api::contract.contract"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::contract-log.contract-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    performed_by: Attribute.Relation<
      "api::contract-log.contract-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedBy: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::contract-log.contract-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiContractTransactionContractTransaction extends Schema.CollectionType {
  collectionName: "contract_transactions";
  info: {
    description: "";
    displayName: "ContractTransaction";
    pluralName: "contract-transactions";
    singularName: "contract-transaction";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.BigInteger & Attribute.Required;
    contract: Attribute.Relation<
      "api::contract-transaction.contract-transaction",
      "manyToOne",
      "api::contract.contract"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::contract-transaction.contract-transaction",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Date: Attribute.DateTime;
    DiscountAmount: Attribute.BigInteger & Attribute.DefaultTo<"0">;
    external_id: Attribute.String;
    external_source: Attribute.String;
    payment_gateway: Attribute.Relation<
      "api::contract-transaction.contract-transaction",
      "manyToOne",
      "api::payment-gateway.payment-gateway"
    >;
    Status: Attribute.Enumeration<["Pending", "Success", "Failed"]>;
    Step: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          max: 100;
          min: 1;
        },
        number
      >;
    TrackId: Attribute.String;
    Type: Attribute.Enumeration<["Cheque", "Gateway", "Manual", "Others", "Return"]> &
      Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::contract-transaction.contract-transaction",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiContractContract extends Schema.CollectionType {
  collectionName: "contracts";
  info: {
    description: "";
    displayName: "Contract";
    pluralName: "contracts";
    singularName: "contract";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    contract_transactions: Attribute.Relation<
      "api::contract.contract",
      "oneToMany",
      "api::contract-transaction.contract-transaction"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::contract.contract", "oneToOne", "admin::user"> &
      Attribute.Private;
    Date: Attribute.DateTime & Attribute.Required;
    external_id: Attribute.String;
    external_source: Attribute.String;
    local_user: Attribute.Relation<
      "api::contract.contract",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    order: Attribute.Relation<"api::contract.contract", "oneToOne", "api::order.order">;
    Status: Attribute.Enumeration<["Not Ready", "Confirmed", "Finished", "Failed", "Cancelled"]> &
      Attribute.DefaultTo<"Not Ready">;
    TaxPercent: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<10>;
    Type: Attribute.Enumeration<["Cash", "Credit"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::contract.contract", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiDiscountDiscount extends Schema.CollectionType {
  collectionName: "discounts";
  info: {
    description: "";
    displayName: "Discount";
    pluralName: "discounts";
    singularName: "discount";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    Code: Attribute.String & Attribute.Required & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::discount.discount", "oneToOne", "admin::user"> &
      Attribute.Private;
    delivery_methods: Attribute.Relation<
      "api::discount.discount",
      "manyToMany",
      "api::shipping.shipping"
    >;
    EndDate: Attribute.DateTime & Attribute.Required;
    IsActive: Attribute.Boolean & Attribute.DefaultTo<false>;
    LimitAmount: Attribute.Integer;
    LimitUsage: Attribute.Integer;
    MaxCartTotal: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    MinCartTotal: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    products: Attribute.Relation<"api::discount.discount", "manyToMany", "api::product.product">;
    removedAt: Attribute.DateTime;
    StartDate: Attribute.DateTime & Attribute.Required;
    Type: Attribute.Enumeration<["Discount", "Cash"]> & Attribute.DefaultTo<"Discount">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::discount.discount", "oneToOne", "admin::user"> &
      Attribute.Private;
    UsedTimes: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
  };
}

export interface ApiEventLogEventLog extends Schema.CollectionType {
  collectionName: "event_logs";
  info: {
    description: "Human-readable event log for users and admins";
    displayName: "EventLog";
    pluralName: "event-logs";
    singularName: "event-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Audience: Attribute.Enumeration<["user", "admin", "superadmin", "all"]> & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::event-log.event-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    EventCategory: Attribute.Enumeration<
      ["StatusChange", "Action", "Notification", "Error", "Info"]
    > &
      Attribute.Required;
    EventType: Attribute.Enumeration<
      ["Order", "Payment", "User", "Product", "Cart", "Wallet", "Shipping", "Admin", "System"]
    > &
      Attribute.Required;
    Message: Attribute.Text & Attribute.Required;
    MessageEn: Attribute.String;
    Metadata: Attribute.JSON;
    performed_by: Attribute.Relation<
      "api::event-log.event-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    RelatedUserId: Attribute.Integer;
    ResourceId: Attribute.String;
    ResourceType: Attribute.String;
    Severity: Attribute.Enumeration<["info", "success", "warning", "error"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::event-log.event-log", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiFooterFooter extends Schema.SingleType {
  collectionName: "footers";
  info: {
    displayName: "Footer";
    pluralName: "footers";
    singularName: "footer";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ContactUs: Attribute.Component<"footer.contact-us">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::footer.footer", "oneToOne", "admin::user"> &
      Attribute.Private;
    CustomerSupport: Attribute.Text;
    First: Attribute.Component<"footer.footer-section">;
    Second: Attribute.Component<"footer.footer-section">;
    Third: Attribute.Component<"footer.footer-section">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::footer.footer", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiGeneralDiscountGeneralDiscount extends Schema.CollectionType {
  collectionName: "general_discounts";
  info: {
    description: "";
    displayName: "GeneralDiscount";
    pluralName: "general-discounts";
    singularName: "general-discount";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::general-discount.general-discount",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    EndDate: Attribute.DateTime & Attribute.Required;
    IsActive: Attribute.Boolean & Attribute.DefaultTo<false>;
    LimitAmount: Attribute.Integer;
    product_categories: Attribute.Relation<
      "api::general-discount.general-discount",
      "oneToMany",
      "api::product-category.product-category"
    >;
    product_variations: Attribute.Relation<
      "api::general-discount.general-discount",
      "manyToMany",
      "api::product-variation.product-variation"
    >;
    removedAt: Attribute.DateTime;
    StartDate: Attribute.DateTime & Attribute.Required;
    Type: Attribute.Enumeration<["Discount", "Cash"]> & Attribute.DefaultTo<"Discount">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::general-discount.general-discount",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiLocalUserAddressLocalUserAddress extends Schema.CollectionType {
  collectionName: "local_user_addresses";
  info: {
    displayName: "LocalUserAddress";
    pluralName: "local-user-addresses";
    singularName: "local-user-address";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-address.local-user-address",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    FullAddress: Attribute.Text;
    PostalCode: Attribute.String & Attribute.Required;
    shipping_city: Attribute.Relation<
      "api::local-user-address.local-user-address",
      "oneToOne",
      "api::shipping-city.shipping-city"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-address.local-user-address",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user: Attribute.Relation<
      "api::local-user-address.local-user-address",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiLocalUserInfoLocalUserInfo extends Schema.CollectionType {
  collectionName: "local_user_infos";
  info: {
    description: "";
    displayName: "LocalUserInfo";
    pluralName: "local-user-infos";
    singularName: "local-user-info";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Bio: Attribute.Text;
    BirthDate: Attribute.Date;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-info.local-user-info",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    FirstName: Attribute.String;
    LastName: Attribute.String;
    NationalCode: Attribute.String;
    Sex: Attribute.Boolean;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-info.local-user-info",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user: Attribute.Relation<
      "api::local-user-info.local-user-info",
      "oneToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiLocalUserLogLocalUserLog extends Schema.CollectionType {
  collectionName: "local_user_logs";
  info: {
    description: "Audit log for LocalUser entity";
    displayName: "LocalUserLog";
    pluralName: "local-user-logs";
    singularName: "local-user-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<["Create", "Update", "Delete"]> & Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::local-user-log.local-user-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    local_user: Attribute.Relation<
      "api::local-user-log.local-user-log",
      "manyToOne",
      "api::local-user.local-user"
    >;
    performed_by: Attribute.Relation<
      "api::local-user-log.local-user-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedBy: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::local-user-log.local-user-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiLocalUserPermissionLocalUserPermission extends Schema.CollectionType {
  collectionName: "local_user_permissions";
  info: {
    description: "";
    displayName: "LocalUserPermission";
    pluralName: "local-user-permissions";
    singularName: "local-user-permission";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-permission.local-user-permission",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Entity: Attribute.String & Attribute.Required;
    Slug: Attribute.String;
    Title: Attribute.String;
    Type: Attribute.Enumeration<["Add", "Get", "GetAll", "Remove", "Update"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-permission.local-user-permission",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user_roles: Attribute.Relation<
      "api::local-user-permission.local-user-permission",
      "manyToMany",
      "api::local-user-role.local-user-role"
    >;
  };
}

export interface ApiLocalUserRoleLocalUserRole extends Schema.CollectionType {
  collectionName: "local_user_roles";
  info: {
    displayName: "LocalUserRole";
    pluralName: "local-user-roles";
    singularName: "local-user-role";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-role.local-user-role",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Title: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-role.local-user-role",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user_permissions: Attribute.Relation<
      "api::local-user-role.local-user-role",
      "manyToMany",
      "api::local-user-permission.local-user-permission"
    >;
    users: Attribute.Relation<
      "api::local-user-role.local-user-role",
      "oneToMany",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiLocalUserWalletTransactionLocalUserWalletTransaction
  extends Schema.CollectionType {
  collectionName: "local_user_wallet_transactions";
  info: {
    displayName: "LocalUserWalletTransaction";
    pluralName: "local-user-wallet-transactions";
    singularName: "local-user-wallet-transaction";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    Cause: Attribute.Text;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-wallet-transaction.local-user-wallet-transaction",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Date: Attribute.DateTime & Attribute.Required;
    Description: Attribute.Text;
    Note: Attribute.Text;
    ReferenceId: Attribute.String & Attribute.Unique;
    Type: Attribute.Enumeration<["Add", "Minus"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-wallet-transaction.local-user-wallet-transaction",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user_wallet: Attribute.Relation<
      "api::local-user-wallet-transaction.local-user-wallet-transaction",
      "manyToOne",
      "api::local-user-wallet.local-user-wallet"
    >;
  };
}

export interface ApiLocalUserWalletLocalUserWallet extends Schema.CollectionType {
  collectionName: "local_user_wallets";
  info: {
    displayName: "LocalUserWallet";
    pluralName: "local-user-wallets";
    singularName: "local-user-wallet";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Balance: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      > &
      Attribute.DefaultTo<"0">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::local-user-wallet.local-user-wallet",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    LastTransactionDate: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::local-user-wallet.local-user-wallet",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user: Attribute.Relation<
      "api::local-user-wallet.local-user-wallet",
      "oneToOne",
      "plugin::users-permissions.user"
    >;
    user_wallet_transactions: Attribute.Relation<
      "api::local-user-wallet.local-user-wallet",
      "oneToMany",
      "api::local-user-wallet-transaction.local-user-wallet-transaction"
    >;
  };
}

export interface ApiLocalUserLocalUser extends Schema.CollectionType {
  collectionName: "local_users";
  info: {
    description: "";
    displayName: "LocalUser";
    pluralName: "local-users";
    singularName: "local-user";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cart: Attribute.Relation<"api::local-user.local-user", "oneToOne", "api::cart.cart">;
    contracts: Attribute.Relation<
      "api::local-user.local-user",
      "oneToMany",
      "api::contract.contract"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::local-user.local-user", "oneToOne", "admin::user"> &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    IsActive: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<true>;
    IsVerified: Attribute.Boolean & Attribute.DefaultTo<false>;
    orders: Attribute.Relation<"api::local-user.local-user", "oneToMany", "api::order.order">;
    Password: Attribute.String & Attribute.Private;
    Phone: Attribute.String & Attribute.Required & Attribute.Unique;
    product_reviews: Attribute.Relation<
      "api::local-user.local-user",
      "oneToMany",
      "api::product-review.product-review"
    >;
    removedAt: Attribute.DateTime;
    strapi_user: Attribute.Integer & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::local-user.local-user", "oneToOne", "admin::user"> &
      Attribute.Private;
    user_addresses: Attribute.Relation<
      "api::local-user.local-user",
      "oneToMany",
      "api::local-user-address.local-user-address"
    >;
    user_role: Attribute.Relation<
      "api::local-user.local-user",
      "manyToOne",
      "api::local-user-role.local-user-role"
    >;
    user_wallet: Attribute.Relation<
      "api::local-user.local-user",
      "oneToOne",
      "api::local-user-wallet.local-user-wallet"
    >;
  };
}

export interface ApiManualAdminActivityManualAdminActivity extends Schema.CollectionType {
  collectionName: "manual_admin_activities";
  info: {
    description: "Structured log for manual actions performed through super-admin/store manager interfaces";
    displayName: "ManualAdminActivity";
    pluralName: "manual-admin-activities";
    singularName: "manual-admin-activity";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<
      ["Create", "Update", "Delete", "Publish", "Unpublish", "Adjust", "Other"]
    > &
      Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::manual-admin-activity.manual-admin-activity",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    Message: Attribute.Text;
    MessageEn: Attribute.String;
    Metadata: Attribute.JSON;
    performed_by: Attribute.Relation<
      "api::manual-admin-activity.manual-admin-activity",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedByName: Attribute.String;
    PerformedByRole: Attribute.String;
    ResourceId: Attribute.String;
    ResourceType: Attribute.Enumeration<
      ["Order", "Product", "User", "Contract", "Discount", "Stock", "Other"]
    > &
      Attribute.Required;
    Severity: Attribute.Enumeration<["info", "success", "warning", "error"]> &
      Attribute.DefaultTo<"info">;
    Title: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::manual-admin-activity.manual-admin-activity",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiNavigationNavigation extends Schema.SingleType {
  collectionName: "navigations";
  info: {
    displayName: "Navigation";
    pluralName: "navigations";
    singularName: "navigation";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::navigation.navigation", "oneToOne", "admin::user"> &
      Attribute.Private;
    product_categories: Attribute.Relation<
      "api::navigation.navigation",
      "oneToMany",
      "api::product-category.product-category"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::navigation.navigation", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiOrderItemOrderItem extends Schema.CollectionType {
  collectionName: "order_items";
  info: {
    description: "";
    displayName: "OrderItem";
    pluralName: "order-items";
    singularName: "order-item";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Count: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::order-item.order-item", "oneToOne", "admin::user"> &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    order: Attribute.Relation<"api::order-item.order-item", "manyToOne", "api::order.order">;
    PerAmount: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    product_color: Attribute.Relation<
      "api::order-item.order-item",
      "oneToOne",
      "api::product-variation-color.product-variation-color"
    >;
    product_size: Attribute.Relation<
      "api::order-item.order-item",
      "oneToOne",
      "api::product-variation-size.product-variation-size"
    >;
    product_variation: Attribute.Relation<
      "api::order-item.order-item",
      "oneToOne",
      "api::product-variation.product-variation"
    >;
    product_variation_model: Attribute.Relation<
      "api::order-item.order-item",
      "oneToOne",
      "api::product-variation-model.product-variation-model"
    >;
    ProductSKU: Attribute.String & Attribute.Required;
    ProductTitle: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::order-item.order-item", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiOrderLogOrderLog extends Schema.CollectionType {
  collectionName: "order_logs";
  info: {
    description: "Audit log for Order entity";
    displayName: "OrderLog";
    pluralName: "order-logs";
    singularName: "order-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<["Create", "Update", "Delete"]> & Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::order-log.order-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    order: Attribute.Relation<"api::order-log.order-log", "manyToOne", "api::order.order">;
    performed_by: Attribute.Relation<
      "api::order-log.order-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedBy: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::order-log.order-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiOrderOrder extends Schema.CollectionType {
  collectionName: "orders";
  info: {
    description: "";
    displayName: "Order";
    pluralName: "orders";
    singularName: "order";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    AppliedDiscountAmount: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    AppliedGeneralDiscountId: Attribute.Integer;
    contract: Attribute.Relation<"api::order.order", "oneToOne", "api::contract.contract">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::order.order", "oneToOne", "admin::user"> &
      Attribute.Private;
    Date: Attribute.DateTime & Attribute.Required;
    delivery_address: Attribute.Relation<
      "api::order.order",
      "manyToOne",
      "api::local-user-address.local-user-address"
    >;
    Description: Attribute.Text;
    DiscountCode: Attribute.String;
    external_id: Attribute.String;
    external_source: Attribute.String;
    Note: Attribute.Text;
    order_items: Attribute.Relation<"api::order.order", "oneToMany", "api::order-item.order-item">;
    PaymentGateway: Attribute.Enumeration<
      ["Unknown", "Wallet", "Mellat", "SnappPay", "SamanKish"]
    > &
      Attribute.DefaultTo<"Unknown">;
    shipping: Attribute.Relation<"api::order.order", "manyToOne", "api::shipping.shipping">;
    ShippingBarcode: Attribute.String;
    ShippingBoxSizeId: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    ShippingCost: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    ShippingPostPrice: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    ShippingTax: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    ShippingWeight: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    Status: Attribute.Enumeration<
      ["Paying", "Started", "Shipment", "Done", "Returned", "Cancelled"]
    > &
      Attribute.DefaultTo<"Paying">;
    Type: Attribute.Enumeration<["Manual", "Automatic"]> & Attribute.DefaultTo<"Automatic">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::order.order", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<"api::order.order", "manyToOne", "plugin::users-permissions.user">;
  };
}

export interface ApiPaymentGatewayPaymentGateway extends Schema.CollectionType {
  collectionName: "payment_gateways";
  info: {
    displayName: "PaymentGateway";
    pluralName: "payment-gateways";
    singularName: "payment-gateway";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    APIKey: Attribute.Text;
    CallbackURL: Attribute.Text;
    contract_transactions: Attribute.Relation<
      "api::payment-gateway.payment-gateway",
      "oneToMany",
      "api::contract-transaction.contract-transaction"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::payment-gateway.payment-gateway",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    IsActive: Attribute.Boolean & Attribute.DefaultTo<false>;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::payment-gateway.payment-gateway",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductCategoryContentProductCategoryContent extends Schema.CollectionType {
  collectionName: "product_category_contents";
  info: {
    description: "";
    displayName: "ProductCategoryContent";
    pluralName: "product-category-contents";
    singularName: "product-category-content";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Audio: Attribute.Media<"audios">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-category-content.product-category-content",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Image: Attribute.Media<"images">;
    IsPublished: Attribute.Boolean & Attribute.DefaultTo<false>;
    IsRTL: Attribute.Boolean & Attribute.DefaultTo<false>;
    Paragraph: Attribute.Text;
    product_category: Attribute.Relation<
      "api::product-category-content.product-category-content",
      "manyToOne",
      "api::product-category.product-category"
    >;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-category-content.product-category-content",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductCategoryProductCategory extends Schema.CollectionType {
  collectionName: "product_categories";
  info: {
    description: "";
    displayName: "ProductCategory";
    pluralName: "product-categories";
    singularName: "product-category";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    children: Attribute.Relation<
      "api::product-category.product-category",
      "oneToMany",
      "api::product-category.product-category"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-category.product-category",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    parent: Attribute.Relation<
      "api::product-category.product-category",
      "manyToOne",
      "api::product-category.product-category"
    >;
    product_category_contents: Attribute.Relation<
      "api::product-category.product-category",
      "oneToMany",
      "api::product-category-content.product-category-content"
    >;
    product_others: Attribute.Relation<
      "api::product-category.product-category",
      "manyToMany",
      "api::product.product"
    >;
    products: Attribute.Relation<
      "api::product-category.product-category",
      "oneToMany",
      "api::product.product"
    >;
    Slug: Attribute.String & Attribute.Required & Attribute.Unique;
    snappay_category: Attribute.String;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-category.product-category",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductFaqProductFaq extends Schema.CollectionType {
  collectionName: "product_faqs";
  info: {
    displayName: "ProductFAQ";
    pluralName: "product-faqs";
    singularName: "product-faq";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Answer: Attribute.Text;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-faq.product-faq", "oneToOne", "admin::user"> &
      Attribute.Private;
    product: Attribute.Relation<
      "api::product-faq.product-faq",
      "manyToOne",
      "api::product.product"
    >;
    Title: Attribute.Text & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-faq.product-faq", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiProductLikeProductLike extends Schema.CollectionType {
  collectionName: "product_likes";
  info: {
    displayName: "ProductLike";
    pluralName: "product-likes";
    singularName: "product-like";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-like.product-like", "oneToOne", "admin::user"> &
      Attribute.Private;
    product: Attribute.Relation<
      "api::product-like.product-like",
      "oneToOne",
      "api::product.product"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-like.product-like", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<
      "api::product-like.product-like",
      "oneToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiProductLogProductLog extends Schema.CollectionType {
  collectionName: "product_logs";
  info: {
    description: "Audit log for Product entity";
    displayName: "ProductLog";
    pluralName: "product-logs";
    singularName: "product-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<["Create", "Update", "Delete"]> & Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-log.product-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    performed_by: Attribute.Relation<
      "api::product-log.product-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedBy: Attribute.String;
    product: Attribute.Relation<
      "api::product-log.product-log",
      "manyToOne",
      "api::product.product"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-log.product-log", "oneToOne", "admin::user"> &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiProductReviewLikeProductReviewLike extends Schema.CollectionType {
  collectionName: "product_review_likes";
  info: {
    displayName: "ProductReviewLike";
    pluralName: "product-review-likes";
    singularName: "product-review-like";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-review-like.product-review-like",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    product_review: Attribute.Relation<
      "api::product-review-like.product-review-like",
      "oneToOne",
      "api::product-review.product-review"
    >;
    Type: Attribute.Enumeration<["Like", "Dislike"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-review-like.product-review-like",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user: Attribute.Relation<
      "api::product-review-like.product-review-like",
      "oneToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiProductReviewReplyProductReviewReply extends Schema.CollectionType {
  collectionName: "product_review_replies";
  info: {
    displayName: "ProductReviewReply";
    pluralName: "product-review-replies";
    singularName: "product-review-reply";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Content: Attribute.Text & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-review-reply.product-review-reply",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    product_review: Attribute.Relation<
      "api::product-review-reply.product-review-reply",
      "manyToOne",
      "api::product-review.product-review"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-review-reply.product-review-reply",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    user: Attribute.Relation<
      "api::product-review-reply.product-review-reply",
      "oneToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiProductReviewProductReview extends Schema.CollectionType {
  collectionName: "product_reviews";
  info: {
    description: "";
    displayName: "ProductReview";
    pluralName: "product-reviews";
    singularName: "product-review";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Content: Attribute.Text & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-review.product-review", "oneToOne", "admin::user"> &
      Attribute.Private;
    Date: Attribute.DateTime & Attribute.Required;
    DislikeCounts: Attribute.Integer & Attribute.DefaultTo<0>;
    LikeCounts: Attribute.Integer & Attribute.DefaultTo<0>;
    product: Attribute.Relation<
      "api::product-review.product-review",
      "manyToOne",
      "api::product.product"
    >;
    product_review_replies: Attribute.Relation<
      "api::product-review.product-review",
      "oneToMany",
      "api::product-review-reply.product-review-reply"
    >;
    Rate: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 0;
        },
        number
      >;
    removedAt: Attribute.DateTime;
    Status: Attribute.Enumeration<["Need for Review", "Rejected", "Accepted"]>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-review.product-review", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<
      "api::product-review.product-review",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiProductSizeHelperProductSizeHelper extends Schema.CollectionType {
  collectionName: "product_size_helpers";
  info: {
    displayName: "ProductSizeHelper";
    pluralName: "product-size-helpers";
    singularName: "product-size-helper";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-size-helper.product-size-helper",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Helper: Attribute.JSON & Attribute.Required;
    product: Attribute.Relation<
      "api::product-size-helper.product-size-helper",
      "oneToOne",
      "api::product.product"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-size-helper.product-size-helper",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductStockLogProductStockLog extends Schema.CollectionType {
  collectionName: "product_stock_logs";
  info: {
    description: "";
    displayName: "ProductStockLog";
    pluralName: "product-stock-logs";
    singularName: "product-stock-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Cause: Attribute.Text;
    Count: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-stock-log.product-stock-log",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    product_stock: Attribute.Relation<
      "api::product-stock-log.product-stock-log",
      "manyToOne",
      "api::product-stock.product-stock"
    >;
    Type: Attribute.Enumeration<["Add", "Minus"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-stock-log.product-stock-log",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductStockProductStock extends Schema.CollectionType {
  collectionName: "product_stocks";
  info: {
    displayName: "ProductStock";
    pluralName: "product-stocks";
    singularName: "product-stock";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Count: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-stock.product-stock", "oneToOne", "admin::user"> &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    product_stock_logs: Attribute.Relation<
      "api::product-stock.product-stock",
      "oneToMany",
      "api::product-stock-log.product-stock-log"
    >;
    product_variation: Attribute.Relation<
      "api::product-stock.product-stock",
      "oneToOne",
      "api::product-variation.product-variation"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-stock.product-stock", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiProductTagProductTag extends Schema.CollectionType {
  collectionName: "product_tags";
  info: {
    displayName: "ProductTag";
    pluralName: "product-tags";
    singularName: "product-tag";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product-tag.product-tag", "oneToOne", "admin::user"> &
      Attribute.Private;
    products: Attribute.Relation<
      "api::product-tag.product-tag",
      "manyToMany",
      "api::product.product"
    >;
    Title: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product-tag.product-tag", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiProductVariationColorProductVariationColor extends Schema.CollectionType {
  collectionName: "product_variation_colors";
  info: {
    displayName: "ProductVariationColor";
    pluralName: "product-variation-colors";
    singularName: "product-variation-color";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ColorCode: Attribute.String & Attribute.Required & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-variation-color.product-variation-color",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    Title: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-variation-color.product-variation-color",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductVariationLogProductVariationLog extends Schema.CollectionType {
  collectionName: "product_variation_logs";
  info: {
    description: "Audit log for ProductVariation entity";
    displayName: "ProductVariationLog";
    pluralName: "product-variation-logs";
    singularName: "product-variation-log";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Action: Attribute.Enumeration<["Create", "Update", "Delete"]> & Attribute.Required;
    Changes: Attribute.JSON;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-variation-log.product-variation-log",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    Description: Attribute.Text;
    IP: Attribute.String;
    performed_by: Attribute.Relation<
      "api::product-variation-log.product-variation-log",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
    PerformedBy: Attribute.String;
    product_variation: Attribute.Relation<
      "api::product-variation-log.product-variation-log",
      "manyToOne",
      "api::product-variation.product-variation"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-variation-log.product-variation-log",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    UserAgent: Attribute.String;
  };
}

export interface ApiProductVariationModelProductVariationModel extends Schema.CollectionType {
  collectionName: "product_variation_models";
  info: {
    displayName: "ProductVariationModel";
    pluralName: "product-variation-models";
    singularName: "product-variation-model";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-variation-model.product-variation-model",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    Title: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-variation-model.product-variation-model",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductVariationSizeProductVariationSize extends Schema.CollectionType {
  collectionName: "product_variation_sizes";
  info: {
    displayName: "ProductVariationSize";
    pluralName: "product-variation-sizes";
    singularName: "product-variation-size";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-variation-size.product-variation-size",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    external_id: Attribute.String;
    external_source: Attribute.String;
    Title: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-variation-size.product-variation-size",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductVariationProductVariation extends Schema.CollectionType {
  collectionName: "product_variations";
  info: {
    description: "";
    displayName: "ProductVariation";
    pluralName: "product-variations";
    singularName: "product-variation";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    DiscountPrice: Attribute.BigInteger &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    external_id: Attribute.String;
    external_source: Attribute.String;
    general_discounts: Attribute.Relation<
      "api::product-variation.product-variation",
      "manyToMany",
      "api::general-discount.general-discount"
    >;
    IsPublished: Attribute.Boolean & Attribute.DefaultTo<false>;
    Price: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    product: Attribute.Relation<
      "api::product-variation.product-variation",
      "manyToOne",
      "api::product.product"
    >;
    product_stock: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "api::product-stock.product-stock"
    >;
    product_variation_color: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "api::product-variation-color.product-variation-color"
    >;
    product_variation_model: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "api::product-variation-model.product-variation-model"
    >;
    product_variation_size: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "api::product-variation-size.product-variation-size"
    >;
    SKU: Attribute.String & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::product-variation.product-variation",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiProductProduct extends Schema.CollectionType {
  collectionName: "products";
  info: {
    description: "";
    displayName: "Product";
    pluralName: "products";
    singularName: "product";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    AverageRating: Attribute.Decimal;
    CleaningTips: Attribute.Text;
    CoverImage: Attribute.Media<"images">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::product.product", "oneToOne", "admin::user"> &
      Attribute.Private;
    Description: Attribute.Text;
    discounts: Attribute.Relation<"api::product.product", "manyToMany", "api::discount.discount">;
    external_id: Attribute.String;
    external_source: Attribute.String;
    Files: Attribute.Media<"files", true>;
    Media: Attribute.Media<"images" | "videos", true>;
    product_faqs: Attribute.Relation<
      "api::product.product",
      "oneToMany",
      "api::product-faq.product-faq"
    >;
    product_main_category: Attribute.Relation<
      "api::product.product",
      "manyToOne",
      "api::product-category.product-category"
    >;
    product_other_categories: Attribute.Relation<
      "api::product.product",
      "manyToMany",
      "api::product-category.product-category"
    >;
    product_reviews: Attribute.Relation<
      "api::product.product",
      "oneToMany",
      "api::product-review.product-review"
    >;
    product_size_helper: Attribute.Relation<
      "api::product.product",
      "oneToOne",
      "api::product-size-helper.product-size-helper"
    >;
    product_tags: Attribute.Relation<
      "api::product.product",
      "manyToMany",
      "api::product-tag.product-tag"
    >;
    product_variations: Attribute.Relation<
      "api::product.product",
      "oneToMany",
      "api::product-variation.product-variation"
    >;
    RatingCount: Attribute.Integer;
    removedAt: Attribute.DateTime;
    ReturnConditions: Attribute.Text;
    Status: Attribute.Enumeration<["Active", "InActive"]>;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::product.product", "oneToOne", "admin::user"> &
      Attribute.Private;
    Weight: Attribute.Integer & Attribute.DefaultTo<100>;
  };
}

export interface ApiShippingCityShippingCity extends Schema.CollectionType {
  collectionName: "shipping_cities";
  info: {
    description: "";
    displayName: "ShippingCity";
    pluralName: "shipping-cities";
    singularName: "shipping-city";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::shipping-city.shipping-city", "oneToOne", "admin::user"> &
      Attribute.Private;
    shipping_province: Attribute.Relation<
      "api::shipping-city.shipping-city",
      "manyToOne",
      "api::shipping-province.shipping-province"
    >;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::shipping-city.shipping-city", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiShippingProvinceShippingProvince extends Schema.CollectionType {
  collectionName: "shipping_provinces";
  info: {
    displayName: "ShippingProvince";
    pluralName: "shipping-provinces";
    singularName: "shipping-province";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "api::shipping-province.shipping-province",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    shipping_cities: Attribute.Relation<
      "api::shipping-province.shipping-province",
      "oneToMany",
      "api::shipping-city.shipping-city"
    >;
    Title: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "api::shipping-province.shipping-province",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface ApiShippingShipping extends Schema.CollectionType {
  collectionName: "shippings";
  info: {
    description: "";
    displayName: "Shipping";
    pluralName: "shippings";
    singularName: "shipping";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::shipping.shipping", "oneToOne", "admin::user"> &
      Attribute.Private;
    discounts: Attribute.Relation<"api::shipping.shipping", "manyToMany", "api::discount.discount">;
    IsActive: Attribute.Boolean;
    orders: Attribute.Relation<"api::shipping.shipping", "oneToMany", "api::order.order">;
    Price: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    removedAt: Attribute.Date;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::shipping.shipping", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface ApiUserActivityUserActivity extends Schema.CollectionType {
  collectionName: "user_activities";
  info: {
    description: "User-facing activity feed entries with readable messages";
    displayName: "User Activity";
    pluralName: "user-activities";
    singularName: "user-activity";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ActivityType: Attribute.Enumeration<
      [
        "order_placed",
        "order_payment_success",
        "order_payment_failed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "cart_item_added",
        "cart_item_removed",
        "cart_cleared",
        "wallet_credited",
        "wallet_debited",
        "address_added",
        "address_updated",
        "address_deleted",
        "profile_updated",
        "product_liked",
        "product_unliked",
        "review_submitted",
        "discount_applied",
        "discount_removed",
      ]
    > &
      Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::user-activity.user-activity", "oneToOne", "admin::user"> &
      Attribute.Private;
    Icon: Attribute.String;
    IsRead: Attribute.Boolean & Attribute.DefaultTo<false>;
    Message: Attribute.Text & Attribute.Required;
    Metadata: Attribute.JSON;
    ResourceId: Attribute.String;
    ResourceType: Attribute.Enumeration<
      ["order", "cart", "wallet", "address", "product", "review", "discount", "other"]
    >;
    Severity: Attribute.Enumeration<["info", "success", "warning", "error"]> &
      Attribute.Required &
      Attribute.DefaultTo<"info">;
    Title: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::user-activity.user-activity", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<
      "api::user-activity.user-activity",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface ApiWalletTopupWalletTopup extends Schema.CollectionType {
  collectionName: "wallet_topups";
  info: {
    displayName: "WalletTopup";
    pluralName: "wallet-topups";
    singularName: "wallet-topup";
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Amount: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: "0";
        },
        string
      >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"api::wallet-topup.wallet-topup", "oneToOne", "admin::user"> &
      Attribute.Private;
    Date: Attribute.DateTime;
    Note: Attribute.Text;
    RefId: Attribute.String;
    SaleOrderId: Attribute.String & Attribute.Unique;
    SaleReferenceId: Attribute.String;
    Status: Attribute.Enumeration<["Pending", "Success", "Failed", "Cancelled"]> &
      Attribute.Required &
      Attribute.DefaultTo<"Pending">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"api::wallet-topup.wallet-topup", "oneToOne", "admin::user"> &
      Attribute.Private;
    user: Attribute.Relation<
      "api::wallet-topup.wallet-topup",
      "manyToOne",
      "plugin::users-permissions.user"
    >;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: "strapi_releases";
  info: {
    displayName: "Release";
    pluralName: "releases";
    singularName: "release";
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      "plugin::content-releases.release",
      "oneToMany",
      "plugin::content-releases.release-action"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::content-releases.release", "oneToOne", "admin::user"> &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<["ready", "blocked", "failed", "done", "empty"]> &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::content-releases.release", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Schema.CollectionType {
  collectionName: "strapi_release_actions";
  info: {
    displayName: "Release Action";
    pluralName: "release-actions";
    singularName: "release-action";
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "plugin::content-releases.release-action",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    entry: Attribute.Relation<"plugin::content-releases.release-action", "morphToOne">;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      "plugin::content-releases.release-action",
      "manyToOne",
      "plugin::content-releases.release"
    >;
    type: Attribute.Enumeration<["publish", "unpublish"]> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "plugin::content-releases.release-action",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: "i18n_locale";
  info: {
    collectionName: "locales";
    description: "";
    displayName: "Locale";
    pluralName: "locales";
    singularName: "locale";
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::i18n.locale", "oneToOne", "admin::user"> &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::i18n.locale", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: "files";
  info: {
    description: "";
    displayName: "File";
    pluralName: "files";
    singularName: "file";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::upload.file", "oneToOne", "admin::user"> &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<"plugin::upload.file", "manyToOne", "plugin::upload.folder"> &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<"plugin::upload.file", "morphToMany">;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::upload.file", "oneToOne", "admin::user"> &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: "upload_folders";
  info: {
    displayName: "Folder";
    pluralName: "folders";
    singularName: "folder";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<"plugin::upload.folder", "oneToMany", "plugin::upload.folder">;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::upload.folder", "oneToOne", "admin::user"> &
      Attribute.Private;
    files: Attribute.Relation<"plugin::upload.folder", "oneToMany", "plugin::upload.file">;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<"plugin::upload.folder", "manyToOne", "plugin::upload.folder">;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::upload.folder", "oneToOne", "admin::user"> &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Schema.CollectionType {
  collectionName: "up_permissions";
  info: {
    description: "";
    displayName: "Permission";
    name: "permission";
    pluralName: "permissions";
    singularName: "permission";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      "plugin::users-permissions.permission",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
    role: Attribute.Relation<
      "plugin::users-permissions.permission",
      "manyToOne",
      "plugin::users-permissions.role"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      "plugin::users-permissions.permission",
      "oneToOne",
      "admin::user"
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: "up_roles";
  info: {
    description: "";
    displayName: "Role";
    name: "role";
    pluralName: "roles";
    singularName: "role";
  };
  pluginOptions: {
    "content-manager": {
      visible: false;
    };
    "content-type-builder": {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::users-permissions.role", "oneToOne", "admin::user"> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      "plugin::users-permissions.role",
      "oneToMany",
      "plugin::users-permissions.permission"
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::users-permissions.role", "oneToOne", "admin::user"> &
      Attribute.Private;
    users: Attribute.Relation<
      "plugin::users-permissions.role",
      "oneToMany",
      "plugin::users-permissions.user"
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: "users";
  info: {
    displayName: "user";
    pluralName: "users";
    singularName: "user";
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    "users-permissions": {
      contentType: "user";
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    cart: Attribute.Relation<"plugin::users-permissions.user", "oneToOne", "api::cart.cart">;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    contracts: Attribute.Relation<
      "plugin::users-permissions.user",
      "oneToMany",
      "api::contract.contract"
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<"plugin::users-permissions.user", "oneToOne", "admin::user"> &
      Attribute.Private;
    email: Attribute.String & Attribute.Unique;
    external_id: Attribute.String;
    external_source: Attribute.String;
    IsActive: Attribute.Boolean & Attribute.Required & Attribute.DefaultTo<true>;
    IsVerified: Attribute.Boolean & Attribute.DefaultTo<false>;
    orders: Attribute.Relation<"plugin::users-permissions.user", "oneToMany", "api::order.order">;
    password: Attribute.String & Attribute.Private;
    phone: Attribute.String & Attribute.Required & Attribute.Unique;
    product_reviews: Attribute.Relation<
      "plugin::users-permissions.user",
      "oneToMany",
      "api::product-review.product-review"
    >;
    provider: Attribute.String;
    removedAt: Attribute.DateTime;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      "plugin::users-permissions.user",
      "manyToOne",
      "plugin::users-permissions.role"
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<"plugin::users-permissions.user", "oneToOne", "admin::user"> &
      Attribute.Private;
    user_addresses: Attribute.Relation<
      "plugin::users-permissions.user",
      "oneToMany",
      "api::local-user-address.local-user-address"
    >;
    user_info: Attribute.Relation<
      "plugin::users-permissions.user",
      "oneToOne",
      "api::local-user-info.local-user-info"
    >;
    user_role: Attribute.Relation<
      "plugin::users-permissions.user",
      "manyToOne",
      "api::local-user-role.local-user-role"
    >;
    user_wallet: Attribute.Relation<
      "plugin::users-permissions.user",
      "oneToOne",
      "api::local-user-wallet.local-user-wallet"
    >;
    username: Attribute.String;
  };
}

declare module "@strapi/types" {
  export module Shared {
    export interface ContentTypes {
      "admin::api-token": AdminApiToken;
      "admin::api-token-permission": AdminApiTokenPermission;
      "admin::permission": AdminPermission;
      "admin::role": AdminRole;
      "admin::transfer-token": AdminTransferToken;
      "admin::transfer-token-permission": AdminTransferTokenPermission;
      "admin::user": AdminUser;
      "api::admin-activity.admin-activity": ApiAdminActivityAdminActivity;
      "api::blog-author.blog-author": ApiBlogAuthorBlogAuthor;
      "api::blog-category.blog-category": ApiBlogCategoryBlogCategory;
      "api::blog-comment.blog-comment": ApiBlogCommentBlogComment;
      "api::blog-post.blog-post": ApiBlogPostBlogPost;
      "api::blog-tag.blog-tag": ApiBlogTagBlogTag;
      "api::cart-item.cart-item": ApiCartItemCartItem;
      "api::cart.cart": ApiCartCart;
      "api::contract-log.contract-log": ApiContractLogContractLog;
      "api::contract-transaction.contract-transaction": ApiContractTransactionContractTransaction;
      "api::contract.contract": ApiContractContract;
      "api::discount.discount": ApiDiscountDiscount;
      "api::event-log.event-log": ApiEventLogEventLog;
      "api::footer.footer": ApiFooterFooter;
      "api::general-discount.general-discount": ApiGeneralDiscountGeneralDiscount;
      "api::local-user-address.local-user-address": ApiLocalUserAddressLocalUserAddress;
      "api::local-user-info.local-user-info": ApiLocalUserInfoLocalUserInfo;
      "api::local-user-log.local-user-log": ApiLocalUserLogLocalUserLog;
      "api::local-user-permission.local-user-permission": ApiLocalUserPermissionLocalUserPermission;
      "api::local-user-role.local-user-role": ApiLocalUserRoleLocalUserRole;
      "api::local-user-wallet-transaction.local-user-wallet-transaction": ApiLocalUserWalletTransactionLocalUserWalletTransaction;
      "api::local-user-wallet.local-user-wallet": ApiLocalUserWalletLocalUserWallet;
      "api::local-user.local-user": ApiLocalUserLocalUser;
      "api::manual-admin-activity.manual-admin-activity": ApiManualAdminActivityManualAdminActivity;
      "api::navigation.navigation": ApiNavigationNavigation;
      "api::order-item.order-item": ApiOrderItemOrderItem;
      "api::order-log.order-log": ApiOrderLogOrderLog;
      "api::order.order": ApiOrderOrder;
      "api::payment-gateway.payment-gateway": ApiPaymentGatewayPaymentGateway;
      "api::product-category-content.product-category-content": ApiProductCategoryContentProductCategoryContent;
      "api::product-category.product-category": ApiProductCategoryProductCategory;
      "api::product-faq.product-faq": ApiProductFaqProductFaq;
      "api::product-like.product-like": ApiProductLikeProductLike;
      "api::product-log.product-log": ApiProductLogProductLog;
      "api::product-review-like.product-review-like": ApiProductReviewLikeProductReviewLike;
      "api::product-review-reply.product-review-reply": ApiProductReviewReplyProductReviewReply;
      "api::product-review.product-review": ApiProductReviewProductReview;
      "api::product-size-helper.product-size-helper": ApiProductSizeHelperProductSizeHelper;
      "api::product-stock-log.product-stock-log": ApiProductStockLogProductStockLog;
      "api::product-stock.product-stock": ApiProductStockProductStock;
      "api::product-tag.product-tag": ApiProductTagProductTag;
      "api::product-variation-color.product-variation-color": ApiProductVariationColorProductVariationColor;
      "api::product-variation-log.product-variation-log": ApiProductVariationLogProductVariationLog;
      "api::product-variation-model.product-variation-model": ApiProductVariationModelProductVariationModel;
      "api::product-variation-size.product-variation-size": ApiProductVariationSizeProductVariationSize;
      "api::product-variation.product-variation": ApiProductVariationProductVariation;
      "api::product.product": ApiProductProduct;
      "api::shipping-city.shipping-city": ApiShippingCityShippingCity;
      "api::shipping-province.shipping-province": ApiShippingProvinceShippingProvince;
      "api::shipping.shipping": ApiShippingShipping;
      "api::user-activity.user-activity": ApiUserActivityUserActivity;
      "api::wallet-topup.wallet-topup": ApiWalletTopupWalletTopup;
      "plugin::content-releases.release": PluginContentReleasesRelease;
      "plugin::content-releases.release-action": PluginContentReleasesReleaseAction;
      "plugin::i18n.locale": PluginI18NLocale;
      "plugin::upload.file": PluginUploadFile;
      "plugin::upload.folder": PluginUploadFolder;
      "plugin::users-permissions.permission": PluginUsersPermissionsPermission;
      "plugin::users-permissions.role": PluginUsersPermissionsRole;
      "plugin::users-permissions.user": PluginUsersPermissionsUser;
    }
  }
}
