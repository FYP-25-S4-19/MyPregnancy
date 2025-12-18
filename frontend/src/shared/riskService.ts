/**
 * Risk prediction API service module.
 * Handles communication with backend risk assessment endpoint.
 */

import api from "@/src/shared/api";

export interface RiskPredictionInput {
  age: number;
  systolic_bp: number;
  diastolic_bp: number;
  bs: number;
  heart_rate: number;
}

export interface RiskPredictionResponse {
  // New multi-class response
  risk_level: "low" | "mid" | "high";
  probabilities: Record<string, number>;
  message: string;
  mean_bp: number;

  // Backwards-compatible fields
  is_high_risk?: boolean;
  risk_probability?: number;
}

/**
 * Submit vital signs to risk prediction API
 * @param vitals Health metrics to assess
 * @returns Risk assessment result
 */
export async function predictRisk(vitals: RiskPredictionInput): Promise<RiskPredictionResponse> {
  try {
    const response = await api.post<RiskPredictionResponse>("/risk/predict", {
      age: vitals.age,
      systolic_bp: vitals.systolic_bp,
      diastolic_bp: vitals.diastolic_bp,
      bs: vitals.bs,
      heart_rate: vitals.heart_rate,
    });

    // Normalize response to maintain backwards compatibility with older UI expectations
    const data = response.data;
    const normalized: RiskPredictionResponse = {
      ...data,
      is_high_risk: data.is_high_risk ?? (data.risk_level === "high"),
      risk_probability:
        data.risk_probability ??
        (data.probabilities
          ? data.probabilities[data.risk_level ?? "high"] ?? data.probabilities["high"]
          : undefined),
    };

    return normalized;
  } catch (error) {
    console.error("Risk prediction API error:", error);
    throw error;
  }
}

/**
 * Check if risk prediction service is healthy
 * @returns Service health status
 */
export async function checkRiskServiceHealth(): Promise<any> {
  try {
    const response = await api.get("/risk/health");
    return response.data;
  } catch (error) {
    console.error("Risk service health check failed:", error);
    return { status: "unavailable" };
  }
}

/**
 * Formatted message for UI display
 * @param response Risk prediction response
 * @returns User-friendly message
 */
export function getRiskMessage(response: RiskPredictionResponse): string {
  // Prefer server message; fall back to built message from risk level
  if (response.message) return response.message;
  const level = response.risk_level ?? (response.is_high_risk ? "high" : "low");
  if (level === "high") return "go to nearby hospital for checkup";
  return `${level.charAt(0).toUpperCase() + level.slice(1)} risk assessment.`;
}

/**
 * Get risk level badge color
 * @param response Risk prediction response
 * @returns Color code for UI badge
 */
export function getRiskColor(response: RiskPredictionResponse): string {
  const level = response.risk_level ?? (response.is_high_risk ? "high" : "low");
  if (level === "high") return "#e74c3c"; // red
  if (level === "mid") return "#f39c12"; // amber/orange for mid
  return "#2ecc71"; // green for low
}
