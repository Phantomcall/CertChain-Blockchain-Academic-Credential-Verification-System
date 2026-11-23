import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/serverAuth';
import { authorizeCronRequest } from '@/lib/cronAuth';
import { captureException, recordMetric, structuredLog } from '@/lib/debug';

export const dynamic = 'force-dynamic';

interface RetentionPurgeResult {
    status: 'succeeded' | 'failed';
    runId: string;
    rowsDeleted?: number;
    verificationLogs?: number;
    contactMessages?: number;
    durationMs?: number;
    error?: string;
}

/**
 * Nightly data-retention purge — the mechanism behind the retention periods
 * published at /legal/privacy.
 *
 * Scheduled by Vercel Cron (see `vercel.json`) at 03:00 UTC. The database
 * function it calls is the same one pg_cron runs where that extension is
 * available, so both schedulers produce identical, recorded outcomes.
 *
 * GET, because that is the method Vercel Cron issues.
 */
export async function GET(request: NextRequest) {
    const requestId = request.headers.get('x-request-id') || 'unknown';

    const auth = authorizeCronRequest(request);
    if (!auth.ok) {
        structuredLog('WARN', 'Rejected cron invocation of retention purge', requestId, {
            status: auth.status,
        });
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        const supabase = getServiceRoleClient();
        const { data, error } = await supabase.rpc('run_retention_purge');

        if (error) {
            throw new Error(error.message);
        }

        const result = data as RetentionPurgeResult | null;

        // The SQL function records its own failure and returns it rather than
        // raising — re-raising would roll the failure record back. Surface it
        // as a 500 so the scheduler reports the run as failed, and emit an
        // alert through the observability pipeline.
        if (!result || result.status !== 'succeeded') {
            const errorMessage = result?.error ?? 'Retention purge failed';
            structuredLog('ERROR', 'Retention purge failed', requestId, {
                runId: result?.runId,
                error: result?.error,
            });
            await captureException(new Error(errorMessage), {
                requestId,
                context: 'GET /api/cron/retention',
                runId: result?.runId,
            });
            await recordMetric('retention_cron.failed', 1, {
                requestId,
                runId: result?.runId,
            });
            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 500 },
            );
        }

        structuredLog('INFO', 'Retention purge completed', requestId, {
            runId: result.runId,
            rowsDeleted: result.rowsDeleted,
            verificationLogs: result.verificationLogs,
            contactMessages: result.contactMessages,
            durationMs: result.durationMs,
        });
        await recordMetric('retention_cron.succeeded', 1, {
            requestId,
            runId: result.runId,
            rowsDeleted: result.rowsDeleted ?? 0,
            verificationLogs: result.verificationLogs ?? 0,
        });

        return NextResponse.json({
            success: true,
            runId: result.runId,
            rowsDeleted: result.rowsDeleted ?? 0,
            deleted: {
                verificationLogs: result.verificationLogs ?? 0,
                contactMessages: result.contactMessages ?? 0,
            },
            durationMs: result.durationMs ?? null,
        });
    } catch (error) {
        await captureException(error, { requestId, context: 'GET /api/cron/retention' });
        await recordMetric('retention_cron.failed', 1, { requestId });
        return NextResponse.json(
            { success: false, error: 'Retention purge could not be started' },
            { status: 500 },
        );
    }
}
