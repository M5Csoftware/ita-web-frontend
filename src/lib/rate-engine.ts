// src/lib/rate-engine.ts
export interface RateEngineInput {
  chargeableWeightKg: number;
  origin: string;
  destination: string;
  commodity: string;
}

export interface RateEngineResult {
  awbFee: number;
  documentation: number;
  pickupDelivery: number;
  other: number;
  breakdown: { label: string; amount: number }[];
}

const AWB_FEE_FLAT = 200;
const DOCUMENTATION_FEE_FLAT = 150;
const PICKUP_BASE = 500;
const PICKUP_PER_KG = 15;
const INTL_HANDLING = 250;
const DOM_HANDLING = 100;

export function calculateRateEngineCharges(
  input: RateEngineInput,
): RateEngineResult {
  const weight = Math.max(0, input.chargeableWeightKg);
  const isInternational = input.origin !== input.destination;

  const awbFee = AWB_FEE_FLAT;
  const documentation = DOCUMENTATION_FEE_FLAT;
  const pickupDelivery = PICKUP_BASE + weight * PICKUP_PER_KG;
  const other = isInternational ? INTL_HANDLING : DOM_HANDLING;

  return {
    awbFee,
    documentation,
    pickupDelivery,
    other,
    breakdown: [
      { label: "AWB fee", amount: awbFee },
      { label: "Documentation", amount: documentation },
      { label: "Pickup / delivery", amount: pickupDelivery },
      { label: "Other charges", amount: other },
    ],
  };
}