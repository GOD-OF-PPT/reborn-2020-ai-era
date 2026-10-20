import type { GameRun } from '../core/run-types.ts';
import { COURSE_CONTENT, COURSE_JOBS } from '../content/course.ts';
import { addDays, quarterOf } from '../core/calendar.ts';

function check(condition: unknown, code: string): asserts condition {
    if (!condition) throw new Error(`COURSE_SHAPE_MONEY:${code}`);
}
function integer(value: number, code: string, signed = false): number {
    check(Number.isSafeInteger(value) && (signed || value >= 0), code);
    return value;
}
function sum(values: readonly number[], signed = false): number {
    const total = values.reduce((n, value) => n + BigInt(integer(value, 'NON_INTEGER_SUM', signed)), 0n);
    const result = Number(total);
    return integer(result, 'UNSAFE_SUM', signed);
}
function unique(values: readonly string[], code: string): void {
    check(new Set(values).size === values.length, code);
}
function financialOperation(signature: string) {
    const value: unknown = JSON.parse(signature);
    check(value !== null && typeof value === 'object' && !Array.isArray(value), 'INVALID_FINANCIAL_SIGNATURE');
    return value as Record<string, unknown>;
}
function text(value: unknown): string | null { return typeof value === 'string' ? value : null; }
function amount(value: unknown): number | null {
    if (value === undefined) return null;
    check(typeof value === 'number', 'INVALID_FINANCIAL_AMOUNT');
    return integer(value, 'INVALID_FINANCIAL_AMOUNT');
}
function context(run: GameRun, cohortId: string) {
    check(run.course && run.operations, 'CONTEXT_REQUIRED');
    const cohort = run.course.cohorts.find(row => row.id === cohortId);
    check(cohort, 'COHORT_REQUIRED');
    const course = run.course.courses.find(row => row.id === cohort.courseId);
    check(course, 'COURSE_REQUIRED');
    const audience = run.course.audiences.find(row => row.id === cohort.audienceId);
    check(audience && audience.courseId === course.id, 'AUDIENCE_REQUIRED');
    const business = run.operations.businesses.find(row => row.id === course.businessId);
    check(business && business.route === 'ai_course', 'BUSINESS_REQUIRED');
    const account = run.economy.ledger.accounts.find(row => row.id === business.accountId);
    check(account && account.kind !== 'external', 'ACCOUNT_REQUIRED');
    return { state: run.course, operations: run.operations, cohort, course, audience, business, account };
}
function quarters(run: GameRun) {
    const rows = new Map<string, { quarter: string; spent: number; reserved: number; actionIds: string[] }>();
    unique(run.economy.actions.map(row => row.definition.id), 'DUPLICATE_ACTION');
    for (const action of run.economy.actions) {
        const points = integer(action.definition.actionPoints, 'INVALID_ACTION_POINTS');
        check(points <= 4, 'INVALID_ACTION_POINTS');
        if (action.status === 'draft' || action.status === 'cancelled') continue;
        const quarter = run.economy.tailQuarterLock === '2025-Q4' && action.definition.startAt >= '2025-10-01'
            ? '2025-Q4' : quarterOf(action.definition.startAt);
        let row = rows.get(quarter);
        if (!row) { row = { quarter, spent: 0, reserved: 0, actionIds: [] }; rows.set(quarter, row); }
        if (action.status === 'reserved') row.reserved += points;
        else row.spent += points;
        row.actionIds.push(action.definition.id);
    }
    return [...rows.values()].sort((a, b) => a.quarter.localeCompare(b.quarter));
}

/** Explicit public fields only: no learning rolls, agency profiles, facts or private notes. */
export function captureCourseMoney(run: GameRun, cohortId: string) {
    const { state, operations, cohort, course, business, account } = context(run, cohortId);
    const ledger = run.economy.ledger;
    const students = state.enrollments.filter(row => row.cohortId === cohortId).map(row => ({
        id: row.id, personId: row.personId, courseId: row.courseId, productKey: row.productKey,
        paymentBatchId: row.paymentBatchId, conversionId: row.conversionId, paidAt: row.paidAt,
        priceFen: row.priceFen, delivered: [...row.delivered], refundedDelivered: [...row.refundedDelivered],
        refundedUnearned: row.refundedUnearned, outcome: row.outcome, recovered: row.recovered,
    }));
    const payments = state.payments.filter(row => row.cohortId === cohortId).map(row => ({ ...row, personIds: [...row.personIds] }));
    const refunds = state.refunds.filter(row => row.cohortId === cohortId).map(row => ({ ...row, personIds: [...row.personIds], operationIds: [...row.operationIds] }));
    const contract = ledger.contracts.find(row => row.id === cohortId);
    const obligations = ledger.obligations.filter(row => row.contractId === cohortId).map(row => ({ ...row }));
    const reservationIds = new Set([...(contract?.protectionReservationId ? [contract.protectionReservationId] : []),
        ...obligations.flatMap(row => row.protectionReservationId ? [row.protectionReservationId] : [])]);
    const reservations = ledger.reservations.filter(row => reservationIds.has(row.id)).map(row => ({ ...row }));
    const financial = ledger.receipts.filter(row => row.contractId === cohortId).map(receipt => {
        const op = financialOperation(receipt.signature);
        check(op.id === receipt.id && op.kind === receipt.kind && op.accountId === receipt.accountId, 'FINANCIAL_RECEIPT_IDENTITY');
        return { id: receipt.id, kind: receipt.kind, status: receipt.status, accountId: receipt.accountId,
            contractId: receipt.contractId, sourceEventId: text(op.sourceEventId), businessId: text(op.businessId),
            date: text(op.date), amountFen: amount(op.amountFen), referenceId: text(op.referenceId),
            reservationId: text(op.reservationId), obligationId: text(op.obligationId) };
    });
    const relatedIds = new Set([...course.sampleAttempts, ...course.refreshJobs.map(row => row.jobId),
        ...cohort.stages.flatMap(row => row.attempts.map(attempt => attempt.jobId)), ...cohort.slots.map(row => row.jobId)]);
    const relatedJobs = operations.jobs.filter(row => relatedIds.has(row.id));
    check(relatedJobs.length === relatedIds.size, 'RELATED_JOB_MISSING');
    const jobs = relatedJobs.map(row => {
        const action = run.economy.actions.find(candidate => candidate.definition.id === row.actionId);
        check(action, 'JOB_ACTION_REQUIRED');
        return { id: row.id, businessId: row.businessId, definitionId: row.definitionId, status: row.status,
            startAt: row.startAt, completeAt: row.completeAt, actionId: row.actionId, actionStatus: action.status,
            accountId: action.definition.accountId, costFen: action.definition.costFen,
            actionPoints: action.definition.actionPoints, cashReservationId: action.definition.cashReservationId };
    });
    const companyMetrics = ledger.metrics.filter(row => row.accountId === account.id && row.businessId === business.id).map(row => ({ ...row }));
    const activeHolds = ledger.reservations.filter(row => row.accountId === account.id && row.status === 'active');
    const heldFen = sum(activeHolds.map(row => row.amountFen));
    return {
        runId: run.runId, revision: run.revision, date: run.timeline.cursor.date, origin: run.origin,
        cohortId, courseId: course.id, businessId: business.id, accountId: account.id,
        productId: course.productId, topicId: course.topicId, edition: course.edition, productKey: course.productKey,
        priceFen: cohort.priceFen, status: cohort.status, startAt: cohort.startAt, endAt: cohort.endAt,
        supportCompleteAt: cohort.supportCompleteAt, remedyDueAt: cohort.remedyDueAt, refundUntil: cohort.refundUntil,
        supportSatisfied: cohort.supportSatisfied, assessmentAt: cohort.assessmentAt,
        feePostedAt: cohort.feePostedAt, feeFen: cohort.feeFen, feeBps: COURSE_CONTENT.feeBps, closedAt: cohort.closedAt,
        students, payments, refunds, stages: cohort.stages.map(row => ({ index: row.index, dueAt: row.dueAt,
            deliveredAt: row.deliveredAt, operationId: row.operationId, amountFen: row.amountFen,
            attempts: row.attempts.map(attempt => ({ ...attempt })) })),
        contract: contract ? { ...contract } : null, obligations, reservations, financial, jobs,
        incomeMetrics: ledger.metrics.filter(row => row.contractId === cohortId && row.kind === 'income').map(row => ({ ...row })),
        company: { cashFen: account.balanceFen, heldFen, availableFen: Math.max(0, account.balanceFen - heldFen),
            incomeFen: sum(companyMetrics.filter(row => row.kind === 'income').map(row => row.deltaFen), true),
            costFen: sum(companyMetrics.filter(row => row.kind === 'cost').map(row => row.deltaFen), true),
            metrics: companyMetrics },
        quarters: quarters(run),
    };
}

/** Independent accounting identities; neither completion nor cash-paid refunds are assumed. */
export function assertCourseMoney(run: GameRun, cohortId: string) {
    const proof = captureCourseMoney(run, cohortId);
    const { course, audience, business } = context(run, cohortId);
    const ledger = run.economy.ledger;
    check(proof.priceFen === audience.priceFen && proof.priceFen > 0, 'FROZEN_AUDIENCE_PRICE');
    unique(proof.students.map(row => row.id), 'DUPLICATE_STUDENT_ID');
    unique(proof.students.map(row => row.personId), 'DUPLICATE_STUDENT_PERSON');
    unique(proof.payments.map(row => row.id), 'DUPLICATE_PAYMENT');
    unique(proof.financial.map(row => row.id), 'DUPLICATE_FINANCIAL_OPERATION');
    unique(proof.refunds.flatMap(row => row.operationIds), 'DUPLICATE_REFUND_OPERATION');
    for (const student of proof.students) {
        check(student.courseId === course.id && student.productKey === course.productKey && student.priceFen === proof.priceFen, 'STUDENT_PRODUCT_OR_PRICE');
        check(student.delivered.length === 2 && student.refundedDelivered.length === 2, 'STUDENT_STAGE_COUNT');
        integer(student.priceFen, 'STUDENT_PRICE');
        check(student.priceFen > 0, 'STUDENT_PRICE');
        const first = Number((BigInt(student.priceFen) + 1n) / 2n);
        for (const index of [0, 1] as const) {
            const delivered = student.delivered[index], refunded = student.refundedDelivered[index];
            check(delivered !== undefined && refunded !== undefined, 'STUDENT_STAGE_REQUIRED');
            integer(delivered, 'STUDENT_DELIVERED'); integer(refunded, 'STUDENT_REFUNDED');
            check(delivered === 0 || delivered === (index === 0 ? first : student.priceFen - first), 'STUDENT_HALF_DELIVERY');
            check(refunded <= delivered, 'REFUND_EXCEEDS_STUDENT_DELIVERY');
        }
        const delivered = sum(student.delivered), refunded = sum(student.refundedDelivered);
        integer(student.refundedUnearned, 'STUDENT_UNEARNED_REFUND');
        check(delivered + student.refundedUnearned <= student.priceFen && refunded + student.refundedUnearned <= student.priceFen, 'STUDENT_PRICE_CONSERVATION');
        check(proof.payments.some(row => row.id === student.paymentBatchId && row.personIds.includes(student.personId)), 'STUDENT_PAYMENT_REQUIRED');
    }
    for (const payment of proof.payments) {
        unique(payment.personIds, 'DUPLICATE_PAYMENT_PERSON');
        const selected = proof.students.filter(row => row.paymentBatchId === payment.id);
        check(selected.length === payment.personIds.length && selected.every(row => payment.personIds.includes(row.personId) && row.paidAt === payment.date), 'PAYMENT_STUDENT_BINDING');
        const expected = sum(selected.map(row => row.priceFen));
        check(expected > 0 && expected === payment.amountFen, 'PAYMENT_AMOUNT');
        const op = proof.financial.find(row => row.id === payment.operationId);
        check(op && op.kind === 'receive_prepayment' && op.amountFen === expected && op.date === payment.date, 'PAYMENT_ORIGINAL_OPERATION');
        const tx = ledger.transactions.filter(row => row.id === payment.operationId);
        check(tx.length === 1 && tx[0]?.lines.length === 2 && tx[0].lines.some(row => row.accountId === proof.accountId && row.deltaFen === expected)
            && tx[0].lines.some(row => row.accountId === 'world' && row.deltaFen === -expected), 'PAYMENT_CASH_TRANSFER');
    }
    const expectedPrepaid = sum(proof.students.map(row => row.priceFen - sum(row.delivered) - row.refundedUnearned));
    const expectedIncome = sum(proof.students.map(row => sum(row.delivered) - sum(row.refundedDelivered)));
    check(proof.contract ? proof.contract.accountId === proof.accountId && proof.contract.businessId === business.id
        && proof.contract.prepaidFen === expectedPrepaid && proof.contract.recognizedIncomeFen === expectedIncome && proof.contract.receivableFen === 0
        : proof.students.length === 0 && expectedPrepaid === 0 && expectedIncome === 0, 'CONTRACT_STUDENT_BALANCE');
    for (const op of proof.financial) check(op.accountId === proof.accountId && op.contractId === cohortId && op.businessId === business.id && op.sourceEventId === cohortId, 'FINANCIAL_OWNERSHIP');
    check(proof.stages.length === 2, 'COHORT_STAGE_COUNT');
    for (const stage of proof.stages) {
        check(stage.index === 0 || stage.index === 1, 'STAGE_INDEX');
        const expected = sum(proof.students.map(row => row.delivered[stage.index] ?? -1));
        check(expected === stage.amountFen, 'STAGE_STUDENT_AMOUNT');
        if (stage.deliveredAt === null) check(expected === 0 && stage.operationId === null, 'PREMATURE_DELIVERY');
        else {
            check(stage.deliveredAt <= proof.date && stage.deliveredAt <= stage.dueAt && stage.attempts.some(attempt => proof.jobs.some(job => job.id === attempt.jobId && job.status === 'completed' && job.completeAt === stage.deliveredAt)), 'STAGE_PHYSICAL_COMPLETION');
            for (const student of proof.students) {
                if (student.priceFen - sum(student.refundedDelivered) - student.refundedUnearned > 0) {
                    const first = Number((BigInt(student.priceFen) + 1n) / 2n);
                    check(student.delivered[stage.index] === (stage.index === 0 ? first : student.priceFen - first), 'PAID_STUDENT_DELIVERY_REQUIRED');
                }
            }
            if (expected === 0) check(stage.operationId === null, 'EMPTY_DELIVERY_OPERATION');
            else {
                const op = proof.financial.find(row => row.id === stage.operationId);
                check(op && op.kind === 'deliver_prepaid' && op.amountFen === expected && op.date === stage.deliveredAt, 'STAGE_ORIGINAL_OPERATION');
                check(!ledger.transactions.some(row => row.id === stage.operationId), 'DELIVERY_MUST_NOT_MINT_CASH');
                const metrics = proof.incomeMetrics.filter(row => row.operationId === stage.operationId);
                check(metrics.length === 1 && metrics[0]?.deltaFen === expected, 'STAGE_INCOME_METRIC');
            }
        }
    }
    check(sum(proof.incomeMetrics.map(row => row.deltaFen), true) === expectedIncome, 'NET_INCOME_METRICS');
    for (const metric of proof.incomeMetrics) {
        const op = proof.financial.find(row => row.id === metric.operationId);
        check(metric.accountId === proof.accountId && metric.businessId === business.id && metric.sourceEventId === cohortId
            && op && (op.kind === 'deliver_prepaid' ? metric.deltaFen === op.amountFen
                : op.kind === 'refund_delivered' && op.amountFen !== null && metric.deltaFen === -op.amountFen), 'INCOME_OPERATION_BINDING');
    }
    for (const refund of proof.refunds) {
        unique(refund.personIds, 'DUPLICATE_REFUND_PERSON');
        check(refund.personIds.every(person => proof.students.some(row => row.personId === person)), 'UNKNOWN_REFUND_PERSON');
        const ops = refund.operationIds.map(id => { const op = proof.financial.find(row => row.id === id); check(op && op.date === refund.date, 'REFUND_OPERATION_REQUIRED'); return op; });
        check(ops.every(op => op.kind === 'refund_undelivered' || op.kind === 'refund_delivered'), 'REFUND_OPERATION_KIND');
        check(sum(ops.filter(op => op.kind === 'refund_undelivered').map(op => op.amountFen ?? -1)) === refund.undeliveredFen
            && sum(ops.filter(op => op.kind === 'refund_delivered').map(op => op.amountFen ?? -1)) === refund.deliveredFen, 'REFUND_RECORD_AMOUNTS');
        for (const op of ops) {
            check(op.kind === 'refund_undelivered' ? proof.payments.some(row => row.operationId === op.referenceId)
                : proof.stages.some(row => row.operationId !== null && row.operationId === op.referenceId), 'REFUND_ORIGINAL_REFERENCE');
            check(proof.obligations.some(row => row.id === op.obligationId && row.originOperationId === op.id && row.amountFen === op.amountFen), 'REFUND_PAYABLE_REQUIRED');
        }
    }
    check(sum(proof.refunds.map(row => row.undeliveredFen)) === sum(proof.students.map(row => row.refundedUnearned))
        && sum(proof.refunds.map(row => row.deliveredFen)) === sum(proof.students.map(row => sum(row.refundedDelivered))), 'REFUND_STUDENT_TOTALS');
    for (const debt of proof.obligations) {
        check(debt.accountId === proof.accountId && debt.businessId === business.id && debt.remainingFen <= debt.amountFen, 'PAYABLE_OWNERSHIP');
        integer(debt.amountFen, 'PAYABLE_AMOUNT'); integer(debt.remainingFen, 'PAYABLE_REMAINING');
        const cashPaid = -sum(ledger.transactions.filter(row => row.referenceId === debt.id).flatMap(row => row.lines.filter(line => line.accountId === proof.accountId).map(line => line.deltaFen)), true);
        check(cashPaid === debt.amountFen - debt.remainingFen, 'PAYABLE_ACTUAL_CASH_PAID');
        if (debt.kind === 'refund_delivered') check(proof.reservations.some(row => row.id === debt.protectionReservationId && row.accountId === proof.accountId && row.kind === 'customer_protection' && row.originId === debt.id && row.amountFen === debt.remainingFen), 'DELIVERED_REFUND_PROTECTION');
    }
    if (proof.contract?.protectionReservationId) {
        const unpaid = sum(proof.obligations.filter(row => row.kind === 'refund_undelivered').map(row => row.remainingFen));
        check(proof.reservations.some(row => row.id === proof.contract?.protectionReservationId && row.kind === 'customer_protection'
            && row.accountId === proof.accountId && row.originId === cohortId && row.amountFen === expectedPrepaid + unpaid), 'PREPAYMENT_AND_REFUND_PROTECTION');
    } else check(expectedPrepaid === 0, 'MISSING_PREPAYMENT_PROTECTION');
    for (const hold of proof.reservations) {
        integer(hold.amountFen, 'INVALID_PROTECTION_AMOUNT');
        check(hold.amountFen > 0 ? hold.status === 'active' : hold.status === 'released', 'INVALID_PROTECTION_STATUS');
    }
    const fee = Number((BigInt(expectedIncome) * BigInt(COURSE_CONTENT.feeBps) + 5000n) / 10000n);
    const feeOps = proof.financial.filter(row => row.kind === 'due_expense');
    if (proof.feePostedAt === null) check(proof.feeFen === 0 && feeOps.length === 0 && proof.closedAt === null, 'PREMATURE_FEE_OR_CLOSE');
    else {
        check(proof.feeFen === fee && proof.feePostedAt === addDays(proof.refundUntil, 1), 'FEE_ROUNDING_OR_DATE');
        check(fee === 0 ? feeOps.length === 0 : feeOps.length === 1 && feeOps[0]?.amountFen === fee && feeOps[0].date === proof.feePostedAt, 'FEE_ORIGINAL_OPERATION');
        if (fee > 0) {
            const metrics = ledger.metrics.filter(row => row.operationId === feeOps[0]?.id && row.kind === 'cost');
            check(metrics.length === 1 && metrics[0]?.deltaFen === fee, 'FEE_COST_METRIC');
        }
    }
    if (proof.closedAt !== null) check(proof.status === 'closed' && proof.feePostedAt !== null && proof.closedAt >= proof.feePostedAt
        && proof.closedAt <= proof.date && proof.obligations.every(row => row.remainingFen === 0), 'CLOSED_WITH_UNPAID_COHORT_DEBT');
    else check(proof.status !== 'closed', 'CLOSED_STATUS_WITHOUT_DATE');
    for (const job of proof.jobs) {
        const definition = COURSE_JOBS.find(row => row.id === job.definitionId);
        check(definition && job.businessId === business.id && job.accountId === proof.accountId && job.costFen === definition.costFen
            && job.actionPoints === definition.actionPoints && job.completeAt === addDays(job.startAt, definition.durationDays), 'JOB_ORIGINAL_TERMS');
        const spent = ['executed', 'completed', 'interrupted'].includes(job.actionStatus);
        const cost = sum(ledger.metrics.filter(row => row.accountId === proof.accountId && row.referenceId === job.actionId && row.kind === 'cost').map(row => row.deltaFen), true);
        check(cost === (spent ? job.costFen : 0), 'JOB_ACTUAL_COST_METRIC');
        if (job.actionStatus === 'reserved' && job.costFen > 0) check(ledger.reservations.some(row => row.id === job.cashReservationId
            && row.accountId === proof.accountId && row.originId === job.actionId && row.kind === 'plan' && row.status === 'active' && row.amountFen === job.costFen), 'JOB_SELF_FUNDED_RESERVATION');
    }
    for (const row of proof.quarters) check(row.spent + row.reserved <= 4, `QUARTER_OVER_FOUR:${row.quarter}`);
    return { ...proof, independentChecks: { paymentBatches: proof.payments.length, stageIncomeFen: sum(proof.stages.map(row => row.amountFen)),
        expectedPrepaidFen: expectedPrepaid, expectedRecognizedIncomeFen: expectedIncome,
        expectedFeeFenIfClosedNow: fee, unpaidCohortFen: sum(proof.obligations.map(row => row.remainingFen)),
        allFinancialIdentitiesPassed: true } };
}

/** All-account transfers remain immutable; only actual target-account cash movement explains its delta. */
export function assertCourseCashDelta(before: GameRun, after: GameRun, accountId: string) {
    check(before.runId === after.runId && before.actorId === after.actorId && after.revision >= before.revision, 'CASH_RUN_IDENTITY');
    const start = before.economy.ledger.accounts.find(row => row.id === accountId);
    const end = after.economy.ledger.accounts.find(row => row.id === accountId);
    check(start && end && start.kind !== 'external' && end.kind === start.kind, 'CASH_ACCOUNT_IDENTITY');
    const oldRows = before.economy.ledger.transactions, allRows = after.economy.ledger.transactions;
    check(allRows.length >= oldRows.length, 'CASH_HISTORY_REMOVED');
    unique(allRows.map(row => row.id), 'DUPLICATE_CASH_TRANSACTION');
    oldRows.forEach((row, index) => check(JSON.stringify(row) === JSON.stringify(allRows[index]), 'CASH_HISTORY_REWRITTEN'));
    const appended = allRows.slice(oldRows.length);
    for (const tx of appended) check(sum(tx.lines.map(row => row.deltaFen), true) === 0, 'UNBALANCED_CASH_TRANSACTION');
    const delta = sum(appended.flatMap(row => row.lines.filter(line => line.accountId === accountId).map(line => line.deltaFen)), true);
    check(end.balanceFen - start.balanceFen === delta, 'CASH_DELTA_NOT_EXPLAINED_BY_TRANSFERS');
    return { runId: before.runId, accountId, beforeRevision: before.revision, afterRevision: after.revision,
        beforeDate: before.timeline.cursor.date, afterDate: after.timeline.cursor.date,
        beforeCashFen: start.balanceFen, afterCashFen: end.balanceFen, transactionDeltaFen: delta,
        appendedTransactionCount: appended.length, accountTransactions: appended.filter(row => row.lines.some(line => line.accountId === accountId))
            .map(row => ({ ...row, lines: row.lines.map(line => ({ ...line })) })), allCashIdentitiesPassed: true };
}
