/**
 * Mellat (Beh Pardakht) Payment Gateway Service - Modern HTTP Implementation
 * This version uses simplified HTTP requests instead of complex SOAP parsing
 */

import axios, { AxiosResponse } from "axios";
import { Strapi } from "@strapi/strapi";

interface MellatConfig {
  terminalId: string;
  username: string;
  password: string;
  gatewayUrl: string;
  paymentUrl: string;
}

interface PaymentRequest {
  orderId: number;
  amount: number;
  userId: number;
  callbackURL?: string;
  contractId?: number;
}

interface TransactionParams {
  orderId: string;
  saleOrderId: string;
  saleReferenceId: string;
}

interface PaymentResponse {
  success: boolean;
  refId?: string;
  redirectUrl?: string;
  error?: string;
  requestId: string;
  code?: string;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  
  /**
   * Get Mellat configuration from environment variables
   */
  getConfig(): MellatConfig {
    return {
      terminalId: process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID",
      username: process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID", 
      password: process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD",
      gatewayUrl: process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw",
      paymentUrl: process.env.MELLAT_PAYMENT_URL || "https://bpm.shaparak.ir/pgwchannel/startpay.mellat"
    };
  },

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId(prefix: string = "REQ"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format callback URL to be absolute
   */
  formatCallbackUrl(callbackURL?: string): string {
    const defaultCallback = "/orders/payment-callback";
    let callbackUrl = callbackURL || defaultCallback;
    
    if (!callbackUrl.startsWith("http")) {
      const baseUrl = strapi.config.get("server.url", "http://localhost:1337");
      callbackUrl = `${baseUrl}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
    }
    
    return callbackUrl;
  },

  /**
   * Generate current date and time for Mellat requests
   */
  getCurrentDateTime() {
    const now = new Date();
    return {
      localDate: now.toISOString().slice(0, 10).replace(/-/g, ""),
      localTime: now.toTimeString().slice(0, 8).replace(/:/g, "")
    };
  },

  /**
   * Create simplified HTTP payload for Mellat (avoiding complex SOAP)
   */
  createPaymentPayload(config: MellatConfig, params: PaymentRequest) {
    const { localDate, localTime } = this.getCurrentDateTime();
    const callbackUrl = this.formatCallbackUrl(params.callbackURL);

    // Use form-urlencoded instead of SOAP XML
    const payload = new URLSearchParams({
      terminalId: config.terminalId,
      userName: config.username,
      userPassword: config.password,
      orderId: params.orderId.toString(),
      amount: params.amount.toString(),
      localDate,
      localTime,
      additionalData: `Contract-${params.contractId || 0}`,
      callBackUrl: callbackUrl,
      payerId: params.userId.toString()
    });

    return { payload, callbackUrl, localDate, localTime };
  },

  /**
   * Make HTTP request to Mellat gateway using form data
   */
  async makeHttpRequest(config: MellatConfig, payload: URLSearchParams, requestId: string): Promise<AxiosResponse> {
    strapi.log.info(`[${requestId}] Making HTTP request to Mellat gateway`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${config.gatewayUrl}/pay`, // Try REST endpoint first
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Infinity-Store/1.0)'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500 // Accept 4xx responses
        }
      );

      const duration = Date.now() - startTime;
      strapi.log.info(`[${requestId}] HTTP response received in ${duration}ms:`, {
        status: response.status,
        contentType: response.headers['content-type']
      });

      return response;

    } catch (error) {
      // If REST endpoint fails, fallback to SOAP but with better handling
      strapi.log.warn(`[${requestId}] REST endpoint failed, trying SOAP fallback`);
      return this.makeSoapFallback(config, payload, requestId);
    }
  },

  /**
   * Fallback to SOAP request with improved error handling
   */
  async makeSoapFallback(config: MellatConfig, payload: URLSearchParams, requestId: string): Promise<AxiosResponse> {
    const { localDate, localTime } = this.getCurrentDateTime();
    
    // Convert URLSearchParams back to individual values for SOAP
    const terminalId = payload.get('terminalId');
    const userName = payload.get('userName');
    const userPassword = payload.get('userPassword');
    const orderId = payload.get('orderId');
    const amount = payload.get('amount');
    const callBackUrl = payload.get('callBackUrl');
    const payerId = payload.get('payerId');
    const additionalData = payload.get('additionalData');

    // Create minimal SOAP request
    const soapXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpPayRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${terminalId}</terminalId>
      <userName>${userName}</userName>
      <userPassword>${userPassword}</userPassword>
      <orderId>${orderId}</orderId>
      <amount>${amount}</amount>
      <localDate>${localDate}</localDate>
      <localTime>${localTime}</localTime>
      <additionalData>${additionalData}</additionalData>
      <callBackUrl>${callBackUrl}</callBackUrl>
      <payerId>${payerId}</payerId>
    </bpPayRequest>
  </soap:Body>
</soap:Envelope>`;

    strapi.log.debug(`[${requestId}] SOAP fallback request:`, { soapXml });

    return axios.post(
      config.gatewayUrl,
      soapXml,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        },
        timeout: 30000
      }
    );
  },

  /**
   * Parse response from Mellat gateway
   */
  parsePaymentResponse(response: AxiosResponse, requestId: string): { refId?: string; error?: string } {
    try {
      const data = response.data;
      
      // Try JSON response first (REST API)
      if (typeof data === 'object' && data.refId) {
        strapi.log.info(`[${requestId}] Parsed JSON response:`, { refId: data.refId });
        return { refId: data.refId };
      }
      
      // Parse SOAP/XML response
      if (typeof data === 'string') {
        // Extract RefId from SOAP response
        const refIdMatch = data.match(/<return[^>]*>([^<]+)<\/return>/);
        
        if (refIdMatch) {
          const refId = refIdMatch[1].trim();
          strapi.log.info(`[${requestId}] Extracted RefId from SOAP:`, { refId });
          
          // Check for error codes
          if (refId.includes(',') || parseInt(refId) < 0) {
            return { error: `Gateway error code: ${refId}` };
          }
          
          if (refId && refId.length >= 5) {
            return { refId };
          }
        }
      }
      
      return { error: "Could not parse payment response" };
      
    } catch (error) {
      strapi.log.error(`[${requestId}] Parse error:`, error);
      return { error: `Response parse error: ${error.message}` };
    }
  },

  /**
   * Main payment request method
   */
  async requestPayment(params: PaymentRequest): Promise<PaymentResponse> {
    const requestId = this.generateRequestId();
    
    try {
      const config = this.getConfig();
      
      strapi.log.info(`[${requestId}] Starting Mellat payment request:`, {
        orderId: params.orderId,
        amount: params.amount,
        userId: params.userId
      });

      // Create payment payload
      const { payload, callbackUrl } = this.createPaymentPayload(config, params);
      
      // Make HTTP request
      const response = await this.makeHttpRequest(config, payload, requestId);
      
      // Parse response
      const parsed = this.parsePaymentResponse(response, requestId);
      
      if (parsed.error) {
        return {
          success: false,
          error: parsed.error,
          requestId
        };
      }
      
      if (parsed.refId) {
        const redirectUrl = `${config.paymentUrl}?RefId=${parsed.refId}`;
        
        return {
          success: true,
          refId: parsed.refId,
          redirectUrl,
          requestId
        };
      }
      
      return {
        success: false,
        error: "Unknown response format",
        requestId
      };
      
    } catch (error) {
      strapi.log.error(`[${requestId}] Payment request failed:`, {
        message: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.message || "Payment request failed",
        requestId,
        code: error.code
      };
    }
  },

  /**
   * Verify transaction after payment
   */
  async verifyTransaction(params: TransactionParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("VERIFY");
    
    try {
      const config = this.getConfig();
      
      strapi.log.info(`[${requestId}] Verifying transaction:`, params);
      
      // Create verification payload
      const payload = new URLSearchParams({
        terminalId: config.terminalId,
        userName: config.username,
        userPassword: config.password,
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId
      });
      
      const response = await axios.post(
        `${config.gatewayUrl}/verify`,
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );
      
      strapi.log.info(`[${requestId}] Verification response:`, {
        status: response.status,
        data: response.data
      });
      
      return {
        success: response.status === 200,
        requestId
      };
      
    } catch (error) {
      strapi.log.error(`[${requestId}] Verification failed:`, error);
      
      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

}); 