import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

// wired-tools port, Parte 3 — telemetría del motor wired de la sala.
export interface WiredToolsMonitorError { agoSeconds: number; type: string; message: string; }

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
            errors: []
        };

        const errCount = wrapper.readInt();
        for(let i = 0; i < errCount; i++)
        {
            s.errors.push({ agoSeconds: wrapper.readInt(), type: wrapper.readString(), message: wrapper.readString() });
        }

        this._snapshot = s;
        return true;
    }

    public get snapshot(): WiredToolsMonitorSnapshot { return this._snapshot; }
}
