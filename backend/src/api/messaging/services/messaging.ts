/**
 * messaging service
 */

export default () => ({
  async sendSMS(ctx, { phone, message, isOTP = true }) {
    try {
      // Normalize phone number: convert 0 prefix to +98
      let normalizedPhone = String(phone).trim();
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = `+98${normalizedPhone.substring(1)}`;
      }
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
      }

      if (isOTP) {
        // Validate required environment variables
        if (!process.env.IP_PANEL_API_URL || !process.env.IP_PANEL_API_KEY || !process.env.IP_PANEL_PATTERN_CODE || !process.env.IP_PANEL_SENDER) {
          strapi.log.error("Missing IP Panel environment variables", {
            hasApiUrl: !!process.env.IP_PANEL_API_URL,
            hasApiKey: !!process.env.IP_PANEL_API_KEY,
            hasPatternCode: !!process.env.IP_PANEL_PATTERN_CODE,
            hasSender: !!process.env.IP_PANEL_SENDER,
          });
          return false;
        }

        const response = await fetch(process.env.IP_PANEL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apiKey: process.env.IP_PANEL_API_KEY,
          },
          body: JSON.stringify({
            recipient: normalizedPhone,
            code: process.env.IP_PANEL_PATTERN_CODE,
            sender: process.env.IP_PANEL_SENDER,
            variable: {
              "verification-code": message,
            },
          }),
        });

        const responseData = (await response.json()) as any;

        // IP Panel returns 200 OK but may have errors in the response body
        if (!response.ok || !responseData?.success) {
          strapi.log.error(`SMS gateway failed for ${normalizedPhone}`, {
            status: response.status,
            response: responseData,
            request: {
              recipient: normalizedPhone,
              code: process.env.IP_PANEL_PATTERN_CODE,
              sender: process.env.IP_PANEL_SENDER,
            },
          });
          return false;
        }

        strapi.log.info(`SMS sent successfully to ${normalizedPhone}`, {
          messageId: responseData?.messageId,
          recipient: normalizedPhone,
        });
      }

      return 200;
    } catch (err) {
      strapi.log.error(err);
      return false;
    }
  },
});
