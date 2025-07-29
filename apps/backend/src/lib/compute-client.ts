/**
 * HTTP Client for Compute Service Communication
 *
 * This client enables the Edge Runtime (backend) to communicate with
 * the Node.js Compute Service for heavy computational tasks.
 */

import type {
  TCampaignAnalyticsResponse,
  TCenterPerformanceResponse,
  TDashboardMetricsResponse,
  TErrorResponse,
  TGeographicReportResponse,
  TTimeBasedReportResponse,
} from "@zerocancer/shared/types";
import { env } from "hono/adapter";
import { TEnvs } from "./types";

export interface ComputeClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export interface TimeReportParams {
  period?: "daily" | "weekly" | "monthly" | "yearly";
  from?: string;
  to?: string;
}

export interface CenterReportParams {
  centerId?: string;
}

export class ComputeClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: ComputeClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retries = config.retries || 3;
  }

  /**
   * Generic HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            `HTTP ${response.status}: ${errorData.error || response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.retries) {
          console.error(`Worker request failed after ${attempt} attempts:`, {
            url,
            error: lastError.message,
          });
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new ComputeClientError(
      `Failed to communicate with compute service: ${lastError!.message}`,
      endpoint,
      lastError!
    );
  }

  /**
   * GET request helper
   */
  private async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  /**
   * POST request helper
   */
  private async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get dashboard metrics from worker
   */
  async getDashboardMetrics(): Promise<TDashboardMetricsResponse> {
    return this.get<TDashboardMetricsResponse>("/api/analytics/dashboard");
  }

  /**
   * Get time-based analytics report
   */
  async getTimeBasedReport(
    params: TimeReportParams = {}
  ): Promise<TTimeBasedReportResponse> {
    return this.get<TTimeBasedReportResponse>(
      "/api/analytics/reports/time",
      params
    );
  }

  /**
   * Get geographic analytics report
   */
  async getGeographicReport(): Promise<TGeographicReportResponse> {
    return this.get<TGeographicReportResponse>("/api/analytics/geographic");
  }

  /**
   * Get center performance reports
   */
  async getCenterPerformanceReport(
    params: CenterReportParams = {}
  ): Promise<TCenterPerformanceResponse> {
    return this.get<TCenterPerformanceResponse>(
      "/api/analytics/centers",
      params
    );
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(): Promise<TCampaignAnalyticsResponse> {
    return this.get<TCampaignAnalyticsResponse>("/api/analytics/campaigns");
  }

  // ============================================================================
  // WAITLIST ENDPOINTS (to be implemented)
  // ============================================================================

  /**
   * Execute waitlist matching algorithm
   */
  async triggerMatching(params: any): Promise<any> {
    return this.post("/api/waitlist/match", params);
  }

  // ============================================================================
  // EMAIL ENDPOINTS (to be implemented)
  // ============================================================================

  /**
   * Send email via worker
   */
  async sendEmail(params: any): Promise<any> {
    return this.post("/api/email/send", params);
  }

  // ============================================================================
  // PDF ENDPOINTS (to be implemented)
  // ============================================================================

  /**
   * Generate PDF document
   */
  async generatePDF(params: any): Promise<any> {
    return this.post("/api/pdf/generate", params);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check worker service health
   */
  async healthCheck(): Promise<{
    ok: boolean;
    status: string;
    uptime: number;
  }> {
    return this.get("/health");
  }
}

/**
 * Custom error class for compute service communication failures
 */
export class ComputeClientError extends Error {
  public readonly endpoint: string;
  public readonly originalError: Error;

  constructor(message: string, endpoint: string, originalError: Error) {
    super(message);
    this.name = "ComputeClientError";
    this.endpoint = endpoint;
    this.originalError = originalError;
  }
}

/**
 * Factory function to create a compute client instance
 */
export function createComputeClient(
  c: any,
  options?: Partial<ComputeClientConfig>
): ComputeClient {
  const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);

  if (!COMPUTE_SERVICE_URL) {
    throw new Error("COMPUTE_SERVICE_URL environment variable is not set");
  }

  return new ComputeClient({
    baseUrl: COMPUTE_SERVICE_URL,
    ...options,
  });
}
