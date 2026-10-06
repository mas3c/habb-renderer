import { IConnection, INitroCommunicationDemo, INitroCommunicationManager, NitroConfiguration, NitroLogger } from '../../api';
import { NitroManager } from '../../core';
import { NitroCommunicationDemoEvent, SocketConnectionEvent } from '../../events';
import { GetTickerTime } from '../../pixi-proxy';
import { Nitro } from '../Nitro';
import { AuthenticatedEvent, ClientHelloMessageComposer, ClientPingEvent, InfoRetrieveMessageComposer, LatencyPingReportMessageComposer, LatencyPingRequestMessageComposer, LatencyPingResponseEvent, PongMessageComposer, SSOTicketMessageComposer } from './messages';

export class NitroCommunicationDemo extends NitroManager implements INitroCommunicationDemo
{
    private _communication: INitroCommunicationManager;

    private _handShaking: boolean;
    private _didConnect: boolean;

    private _pongInterval: any;

    // Latencia como Habbo (LatencyTracker): cada 20 s se manda un número, el servidor lo
    // devuelve y se cronometra; cada 3 medidas se manda la media al emulador, que se la
    // enseña al staff (ModTool y :playerinfo). El jugador no la ve, como en Habbo.
    private _latencyInterval: any = null;
    private _latencyId: number = 0;
    private _latencySent: Map<number, number> = new Map();
    private _latencies: number[] = [];

    constructor(communication: INitroCommunicationManager)
    {
        super();

        this._communication = communication;

        this._handShaking = false;
        this._didConnect = false;

        this._pongInterval = null;

        this.onConnectionOpenedEvent = this.onConnectionOpenedEvent.bind(this);
        this.onConnectionClosedEvent = this.onConnectionClosedEvent.bind(this);
        this.onConnectionErrorEvent = this.onConnectionErrorEvent.bind(this);
        this.sendPong = this.sendPong.bind(this);
    }

    protected onInit(): void
    {
        const connection = this._communication.connection;

        if(connection)
        {
            connection.addEventListener(SocketConnectionEvent.CONNECTION_OPENED, this.onConnectionOpenedEvent);
            connection.addEventListener(SocketConnectionEvent.CONNECTION_CLOSED, this.onConnectionClosedEvent);
            connection.addEventListener(SocketConnectionEvent.CONNECTION_ERROR, this.onConnectionErrorEvent);
        }

        this._communication.registerMessageEvent(new ClientPingEvent(this.onClientPingEvent.bind(this)));
        this._communication.registerMessageEvent(new LatencyPingResponseEvent(this.onLatencyPingResponse.bind(this)));
        this._communication.registerMessageEvent(new AuthenticatedEvent(this.onAuthenticatedEvent.bind(this)));
    }

    protected onDispose(): void
    {
        const connection = this._communication.connection;

        if(connection)
        {
            connection.removeEventListener(SocketConnectionEvent.CONNECTION_OPENED, this.onConnectionOpenedEvent);
            connection.removeEventListener(SocketConnectionEvent.CONNECTION_CLOSED, this.onConnectionClosedEvent);
            connection.removeEventListener(SocketConnectionEvent.CONNECTION_ERROR, this.onConnectionErrorEvent);
        }

        this._handShaking = false;

        this.stopPonging();

        this.stopLatency();

        super.onDispose();
    }

    private onConnectionOpenedEvent(event: Event): void
    {
        const connection = this._communication.connection;

        if(!connection) return;

        this._didConnect = true;

        this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_ESTABLISHED, connection);

        if(NitroConfiguration.getValue<boolean>('system.pong.manually', false)) this.startPonging();

        this.startHandshake(connection);

        connection.send(new ClientHelloMessageComposer(null, null, null, null));

        this.tryAuthentication(connection);
    }

    private onConnectionClosedEvent(event: CloseEvent): void
    {
        const connection = this._communication.connection;

        if(!connection) return;

        this.stopPonging();

        this.stopLatency();

        if(this._didConnect) this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_CLOSED, connection);
        // El socket se cerró ANTES de abrir (onopen nunca disparó): handshake WS
        // rechazado / reset durante el Upgrade (WAF, QUIC, cabeceras grandes, corte
        // de red). El navegador a veces sólo emite onclose, no onerror. Sin esto el
        // evento se traga y el cliente se queda congelado en el 40%. Avisamos para
        // que la UI reaccione (mensaje + recarga con SSO nueva).
        else this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_HANDSHAKE_FAILED, connection);
    }

    private onConnectionErrorEvent(event: CloseEvent): void
    {
        const connection = this._communication.connection;

        if(!connection) return;

        this.stopPonging();

        this.stopLatency();

        this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_ERROR, connection);
    }

    private tryAuthentication(connection: IConnection): void
    {
        if(!connection || !this.getSSO())
        {
            if(!this.getSSO())
            {
                NitroLogger.error('Login without an SSO ticket is not supported');
            }

            this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_HANDSHAKE_FAILED, connection);

            return;
        }

        connection.send(new SSOTicketMessageComposer(this.getSSO(), GetTickerTime()));
    }

    private onClientPingEvent(event: ClientPingEvent): void
    {
        if(!event || !event.connection) return;

        this.sendPong(event.connection);
    }

    private onAuthenticatedEvent(event: AuthenticatedEvent): void
    {
        if(!event || !event.connection) return;

        this.completeHandshake(event.connection);

        this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_AUTHENTICATED, event.connection);

        event.connection.send(new InfoRetrieveMessageComposer());

        this.startLatency();
    }

    private startHandshake(connection: IConnection): void
    {
        this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_HANDSHAKING, connection);

        this._handShaking = true;
    }

    private completeHandshake(connection: IConnection): void
    {
        this.dispatchCommunicationDemoEvent(NitroCommunicationDemoEvent.CONNECTION_HANDSHAKED, connection);

        this._handShaking = false;
    }

    private startPonging(): void
    {
        this.stopPonging();

        this._pongInterval = setInterval(this.sendPong, NitroConfiguration.getValue<number>('system.pong.interval.ms', 20000));
    }

    private stopPonging(): void
    {
        if(!this._pongInterval) return;

        clearInterval(this._pongInterval);

        this._pongInterval = null;
    }

    private sendPong(connection: IConnection = null): void
    {
        connection = ((connection || this._communication.connection) || null);

        if(!connection) return;

        connection.send(new PongMessageComposer());
    }

    private startLatency(): void
    {
        this.stopLatency();

        // la primera a los 20 s: justo al entrar el cliente está cargando y la medida sale inflada
        this._latencyInterval = setInterval(() => this.sendLatencyPing(), 20000);
    }

    private stopLatency(): void
    {
        if(this._latencyInterval) clearInterval(this._latencyInterval);

        this._latencyInterval = null;
        this._latencySent.clear();
        this._latencies = [];
    }

    private sendLatencyPing(): void
    {
        const connection = this._communication.connection;

        // en segundo plano el navegador retrasa los temporizadores y la medida saldría inflada
        if(!connection || document.hidden) return;

        const ahora = performance.now();

        for(const [ id, enviado ] of this._latencySent) if((ahora - enviado) > 60000) this._latencySent.delete(id);

        const id = ++this._latencyId;

        this._latencySent.set(id, ahora);

        connection.send(new LatencyPingRequestMessageComposer(id));
    }

    private onLatencyPingResponse(event: LatencyPingResponseEvent): void
    {
        const enviado = this._latencySent.get(event.getParser().id);

        if(enviado === undefined) return;

        this._latencySent.delete(event.getParser().id);
        this._latencies.push(Math.round(performance.now() - enviado));

        if(this._latencies.length < 3) return;

        const media = (valores: number[]) => Math.round(valores.reduce((a, b) => (a + b), 0) / valores.length);
        const average = media(this._latencies);
        // sin los picos (más del doble de la media), como Habbo
        const validas = this._latencies.filter(valor => (valor <= (average * 2)));

        event.connection.send(new LatencyPingReportMessageComposer(average, media(validas), validas.length));

        this._latencies = [];
    }

    private dispatchCommunicationDemoEvent(type: string, connection: IConnection): void
    {
        Nitro.instance.events.dispatchEvent(new NitroCommunicationDemoEvent(type, connection));
    }

    private getSSO(): string
    {
        return NitroConfiguration.getValue('sso.ticket', null);
    }
}
