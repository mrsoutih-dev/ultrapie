import { AIUsageReport } from '@ultrapie/shared';

export interface ModelPricing {
  promptCostPerMillion: number;
  candidateCostPerMillion: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-2.5-flash': {
    promptCostPerMillion: 0.15,
    candidateCostPerMillion: 0.60,
  },
  'gemini-1.5-pro': {
    promptCostPerMillion: 1.25,
    candidateCostPerMillion: 5.00,
  },
  default: {
    promptCostPerMillion: 0.20,
    candidateCostPerMillion: 0.80,
  },
};

export class TokenMeter {
  static calculateUsage(
    promptTokens: number,
    candidateTokens: number,
    modelName: string = 'gemini-2.5-flash'
  ): AIUsageReport {
    const pricing = MODEL_PRICING[modelName] || MODEL_PRICING.default;
    const promptCost = (promptTokens / 1_000_000) * pricing.promptCostPerMillion;
    const candidateCost = (candidateTokens / 1_000_000) * pricing.candidateCostPerMillion;
    const estimatedCostUsd = Number((promptCost + candidateCost).toFixed(6));

    return {
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      estimatedCostUsd,
    };
  }

  static isQuotaExceeded(
    currentTotalTokens: number,
    requestTokens: number,
    quotaLimit: number
  ): boolean {
    return currentTotalTokens + requestTokens > quotaLimit;
  }
}
