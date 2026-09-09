import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

// wired-tools port, Parte 3 — telemetría del motor wired de la sala.
export interface WiredToolsMonitorError { agoSeconds: number; type: string; message: string; }

// Contadores fijos por tipo (EXECUTION_CAP, DELAYED_EVENTS_CAP, ...) + historial.
export interface WiredToolsMonitorLog { type: string; severity: string; amount: number; latestSeconds: number; }
export interface WiredToolsMonitorHistory { type: string; severity: string; agoSeconds: number; reason: string; }

export interface WiredToolsMonitorSnapshot
{
    rateLimitActive: boolean;
    rateLimitPerWindow: number;
    rateLimitUsageNow: number;
    rateLimitSuspendSecondsLeft: number;
    delayedPending: number;
    execCount: number;
    avgExecMs: string;
    peakExecMs: string;
    errors: WiredToolsMonitorError[];
    logs: WiredToolsMonitorLog[];
    history: WiredToolsMonitorHistory[];
}

export class WiredToolsMonitorParser implements IMessageParser
{
    private _snapshot: WiredToolsMonitorSnapshot;

    public flush(): boolean { this._snapshot = null; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const s: WiredToolsMonitorSnapshot = {
            rateLimitActive: wrapper.readBoolean(),
            rateLimitPerWindow: wrapper.readInt(),
            rateLimitUsageNow: wrapper.readInt(),
            rateLimitSuspendSecondsLeft: wrapper.readInt(),
            delayedPending: wrapper.readInt(),
            execCount: wrapper.readInt(),
            avgExecMs: wrapper.readString(),
            peakExecMs: wrapper.readString(),
            errors: [],
            logs: [],
            history: []
        };

        const errCount = wrapper.readInt();
        for(let i = 0; i < errCount; i++)
        {
            s.errors.push({ agoSeconds: wrapper.readInt(), type: wrapper.readString(), message: wrapper.readString() });
        }

        const logCount = wrapper.readInt();
        for(let i = 0; i < logCount; i++)
        {
            s.logs.push({ type: wrapper.readString(), severity: wrapper.readString(), amount: wrapper.readInt(), latestSeconds: wrapper.readInt() });
        }

        const histCount = wrapper.readInt();
        for(let i = 0; i < histCount; i++)
        {
            s.history.push({ type: wrapper.readString(), severity: wrapper.readString(), agoSeconds: wrapper.readInt(), reason: wrapper.readString() });
        }

        this._snapshot = s;
        return true;
    }

    public get snapshot(): WiredToolsMonitorSnapshot { return this._snapshot; }
}
