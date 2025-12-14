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
  is_high_risk: boolean;
  risk_probability: number;
  message: string;
  mean_bp: number;
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
    return response.data;
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
  return response.message;
}

/**
 * Get risk level badge color
 * @param response Risk prediction response
 * @returns Color code for UI badge
 */
export function getRiskColor(response: RiskPredictionResponse): string {
  return response.is_high_risk ? "#e74c3c" : "#2ecc71"; // red or green
}
