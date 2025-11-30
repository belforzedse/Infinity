/**
 * plugin-user controller
 * Handles plugin user (users-permissions.user) management operations
 */

import { validatePhone } from "../../auth/utils/validations";

export default {
  async createPluginUser(ctx) {
    const {
      firstName = null,
      lastName = null,
      phone,
      password = null,
      birthDate = null,
      gender = null,
      bio = null,
      isActive = true,
      nationalCode = null,
      role = null,
    } = ctx.request.body;

    if (validatePhone(ctx, phone) !== 200) {
      return ctx;
    }

    const user = await strapi
      .service("api::plugin-user.plugin-user")
      .createPluginUser(ctx, {
        userData: {
          phone,
          password,
          isActive,
          role,
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
};

