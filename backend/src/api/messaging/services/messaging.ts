/**
 * messaging service
 */

export default () => ({
  async sendSMS(ctx, { phone, message, isOTP = true }) {
    try {
      if (isOTP) {
        await fetch("https://api2.ippanel.com/api/v1/sms/pattern/normal/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apiKey: process.env.IP_PANEL_API_KEY,
          },
          body: JSON.stringify({
            recipient: phone,
            code: "42d3urtbfhm6p8g",
            sender: "+983000505",
            variable: {
              "verification-code": message,
            },
          }),
        });
      }

      return 200;
    } catch (err) {
      strapi.log.error(err);
      return false;
    }
  },
});
