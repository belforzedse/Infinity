/**
 * Export all payment gateway services
 */

import paymentGateway from "./payment-gateway";
import mellat from "./mellat";
import mellatV2 from "./mellat-v2";
import mellatV3 from "./mellat-v3";
import samanKish from "./saman-kish";
import snappay from "./snappay";

export default {
  "payment-gateway": paymentGateway,
  mellat: mellat,
  "mellat-v2": mellatV2,
  "mellat-v3": mellatV3,
  "saman-kish": samanKish,
  snappay: snappay,
};
