/**
 * local-user controller
 */

import { factories } from "@strapi/strapi";
import { validatePhone } from "../../auth/utils/validations";

export default factories.createCoreController("api::local-user.local-user", {
  async createUser(ctx) {
    const {
      firstName = null,
      lastName = null,
      phone,
      password = null,
      birthDate = null,
      gender = null,
      bio = null,
      isActive = false,
      nationalCode = null,
      role = 1,
    } = ctx.request.body;

    if (validatePhone(ctx, phone) !== 200) {
      return ctx;
    }

    const user = await strapi
      .service("api::local-user.local-user")
      .createUser(ctx, {
        userData: {
          Phone: `+98${phone?.substring(1)}`,
          Password: password,
          IsActive: isActive,
          user_role: role,
        },
        userInfoData: {
          FirstName: firstName,
          LastName: lastName,
          BirthDate: birthDate,
          Sex: gender,
          Bio: bio,
          NationalCode: nationalCode,
        },
      });

    if (!user) {
      return ctx;
    }

    ctx.body = user;
  },

  async updateUser(ctx) {
    const {
      firstName = null,
      lastName = null,
      birthDate = null,
      gender = null,
      bio = null,
      isActive = false,
      nationalCode = null,
      role = 1,
    } = ctx.request.body;

    const user = await strapi
      .service("api::local-user.local-user")
      .updateUser(ctx, {
        userData: {
          IsActive: isActive,
          user_role: role,
        },
        userInfoData: {
          FirstName: firstName,
          LastName: lastName,
          BirthDate: birthDate,
          Sex: gender,
          Bio: bio,
          NationalCode: nationalCode,
        },
      });

    if (!user) {
      return ctx;
    }

    ctx.body = user;
  },
});
