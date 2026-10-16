export type FeePlanKey = 'full' | 'half' | 'term';

export interface IFeeInstallment {
  installmentNumber: number;
  title: string;
  amount: number;
  dueDescription: string;
  dueDate?: string;
  status: 'paid' | 'partially_paid' | 'pending';
  paidAmount: number;
  remainingAmount: number;
}

export interface IFeePlanConfig {
  id: string;
  key: FeePlanKey;
  optionNumber: number;
  name: string;
  label: string;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  discount: number;
  description: string;
  schedule: {
    installmentNumber: number;
    title: string;
    amount: number;
    dueDescription: string;
  }[];
}

export const FEE_PLANS: Record<FeePlanKey, IFeePlanConfig> = {
  full: {
    id: 'full_payment',
    key: 'full',
    optionNumber: 1,
    name: 'Full Payment',
    label: '1. Full Payment - ₹43,000 (One-Time)',
    totalAmount: 43000,
    installmentsCount: 1,
    installmentAmount: 43000,
    discount: 2000,
    description: 'One-time complete payment with flat ₹2,000 discount (Standard ₹45,000 discounted to ₹43,000)',
    schedule: [
      {
        installmentNumber: 1,
        title: 'Full Course Fee (100%)',
        amount: 43000,
        dueDescription: 'Due upon enrollment',
      },
    ],
  },
  half: {
    id: 'half_payment',
    key: 'half',
    optionNumber: 2,
    name: '2 Half Payment',
    label: '2. 2 Half Payments - ₹45,000 (Split ₹22,500 x 2)',
    totalAmount: 45000,
    installmentsCount: 2,
    installmentAmount: 22500,
    discount: 0,
    description: 'Split into 2 equal half-yearly installments of ₹22,500 each (Total ₹45,000)',
    schedule: [
      {
        installmentNumber: 1,
        title: '1st Half Payment (50%)',
        amount: 22500,
        dueDescription: 'Due upon enrollment / Term 1 Start',
      },
      {
        installmentNumber: 2,
        title: '2nd Half Payment (50%)',
        amount: 22500,
        dueDescription: 'Due at Mid-Academic Year (Month 6)',
      },
    ],
  },
  term: {
    id: 'term_payment',
    key: 'term',
    optionNumber: 3,
    name: 'Term Payment',
    label: '3. Term Payment - ₹45,000 (3 Terms x ₹15,000)',
    totalAmount: 45000,
    installmentsCount: 3,
    installmentAmount: 15000,
    discount: 0,
    description: 'Split into 3 term installments of ₹15,000 each (₹45,000 / 3 = ₹15,000)',
    schedule: [
      {
        installmentNumber: 1,
        title: 'Term 1 Fee',
        amount: 15000,
        dueDescription: 'Due upon enrollment / Term 1',
      },
      {
        installmentNumber: 2,
        title: 'Term 2 Fee',
        amount: 15000,
        dueDescription: 'Due at Term 2 start (Month 4)',
      },
      {
        installmentNumber: 3,
        title: 'Term 3 Fee',
        amount: 15000,
        dueDescription: 'Due at Term 3 start (Month 8)',
      },
    ],
  },
};

/**
 * Returns all available fee plan options for client selection
 */
export function getAllFeePlans(): IFeePlanConfig[] {
  return [FEE_PLANS.full, FEE_PLANS.half, FEE_PLANS.term];
}

/**
 * Flexible normalizer that handles strings like:
 * 'full', 'full_payment', '1', '1. full payment', '43000'
 * 'half', 'half_payment', '2half', '2', 'split', '22500'
 * 'term', 'term_payment', '3term', '3', '15000', '45000/3'
 */
export function normalizeFeePlanKey(input?: any): FeePlanKey {
  if (!input) return 'term';
  const str = String(input).toLowerCase().trim();

  // 1. Explicit keyword checks (Highest precedence)
  if (
    str.includes('term') ||
    str.includes('15000') ||
    str.includes('45000/3') ||
    str === '3' ||
    str === 'term_payment'
  ) {
    return 'term';
  }

  if (
    str.includes('half') ||
    str.includes('22500') ||
    str.includes('split') ||
    str === '2' ||
    str === 'half_payment' ||
    str === '2half'
  ) {
    return 'half';
  }

  if (
    str.includes('full') ||
    str.includes('43000') ||
    str.includes('one-time') ||
    str.includes('onetime') ||
    str === '1' ||
    str === 'full_payment'
  ) {
    return 'full';
  }

  // 2. Prefix fallback
  if (str.startsWith('1')) return 'full';
  if (str.startsWith('2')) return 'half';
  if (str.startsWith('3')) return 'term';

  return 'term';
}

/**
 * Calculate scheduled installments and payment progress based on paidFees
 */
export function calculateInstallments(
  planKey: FeePlanKey,
  totalFees: number,
  paidFees: number
): IFeeInstallment[] {
  const plan = FEE_PLANS[planKey] || FEE_PLANS.term;
  const count = plan.installmentsCount;

  // Base installment split
  const isDefaultTotal = totalFees === plan.totalAmount;
  const baseAmount = isDefaultTotal ? plan.installmentAmount : Math.floor(totalFees / count);
  const remainder = totalFees - baseAmount * count;

  let cumulativePaid = Math.max(0, Number(paidFees) || 0);

  return plan.schedule.map((sched, idx) => {
    const isLast = idx === count - 1;
    const target = isDefaultTotal ? sched.amount : isLast ? baseAmount + remainder : baseAmount;

    let installmentPaid = 0;
    let status: 'paid' | 'partially_paid' | 'pending' = 'pending';

    if (cumulativePaid >= target) {
      installmentPaid = target;
      status = 'paid';
      cumulativePaid -= target;
    } else if (cumulativePaid > 0) {
      installmentPaid = cumulativePaid;
      status = 'partially_paid';
      cumulativePaid = 0;
    } else {
      installmentPaid = 0;
      status = 'pending';
    }

    return {
      installmentNumber: sched.installmentNumber,
      title: sched.title,
      amount: target,
      dueDescription: sched.dueDescription,
      status,
      paidAmount: installmentPaid,
      remainingAmount: Math.max(0, target - installmentPaid),
    };
  });
}

/**
 * Find the next pending or partially-paid installment
 */
export function getNextDueInstallment(installments: IFeeInstallment[]) {
  const next = installments.find((inst) => inst.status === 'pending' || inst.status === 'partially_paid');
  if (!next) return null;
  return {
    installmentNumber: next.installmentNumber,
    title: next.title,
    amountDue: next.remainingAmount,
    totalAmount: next.amount,
    status: next.status,
    dueDescription: next.dueDescription,
  };
}

/**
 * Comprehensive resolver for student registration and updates
 */
export function resolveStudentFeeDetails(params: {
  feeType?: any;
  customTotalFees?: any;
  paidFees?: any;
}) {
  const planKey = normalizeFeePlanKey(params.feeType);
  const plan = FEE_PLANS[planKey];

  let totalFees: number;
  const rawTotal = params.customTotalFees !== undefined && params.customTotalFees !== null && params.customTotalFees !== ''
    ? Number(params.customTotalFees)
    : NaN;

  if (isNaN(rawTotal) || rawTotal <= 0) {
    totalFees = plan.totalAmount;
  } else if (planKey === 'full' && rawTotal === 45000) {
    // If client form defaulted to 45000 before selecting full payment, adjust to 43000
    totalFees = 43000;
  } else {
    totalFees = rawTotal;
  }

  const paidFees = Math.max(0, Number(params.paidFees) || 0);
  const dueFees = Math.max(0, totalFees - paidFees);
  const installments = calculateInstallments(planKey, totalFees, paidFees);
  const nextDue = getNextDueInstallment(installments);

  return {
    feeType: planKey,
    feePaymentPlan: plan.id,
    feePlanLabel: plan.label,
    totalFees,
    paidFees,
    dueFees,
    installmentCount: plan.installmentsCount,
    installmentAmount: totalFees === plan.totalAmount ? plan.installmentAmount : Math.round(totalFees / plan.installmentsCount),
    discount: plan.discount,
    installments,
    nextDueInstallment: nextDue,
  };
}
