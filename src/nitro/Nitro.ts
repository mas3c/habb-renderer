import { Application, ApplicationOptions, TextureSource, WebGLRenderer } from 'pixi.js';
import { IAvatarRenderManager, IEventDispatcher, ILinkEventTracker, INitroCommunicationManager, INitroCore, INitroLocalizationManager, IRoomCameraWidgetManager, IRoomEngine, IRoomManager, IRoomSessionManager, ISessionDataManager, ISoundManager, NitroConfiguration, NitroLogger } from '../api';
import { ConfigurationEvent, EventDispatcher, NitroCore } from '../core';
import { NitroEvent, RoomEngineEvent } from '../events';
import { GetTicker, NitroBlendMode, PixiApplicationProxy } from '../pixi-proxy';
import { RoomManager } from '../room';
import { AvatarRenderManager } from './avatar';
import { RoomCameraWidgetManager } from './camera';
import { NitroCommunicationManager } from './communication';
import { LegacyExternalInterface } from './externalInterface';
import { GameMessageHandler } from './game';
import { INitro } from './INitro';
import { NitroLocalizationManager } from './localization';
import './Plugins';
import { LandscapeRasterizer, RoomEngine } from './room';
import { RoomSessionManager, SessionDataManager } from './session';
import { SoundManager } from './sound';
import { HabboWebTools } from './utils/HabboWebTools';

LegacyExternalInterface.available;

// Pixel art: sin suavizado salvo con zoom del sistema no entero (antes settings.SCALE_MODE en Pixi 6).
TextureSource.defaultOptions.scaleMode = (!(window.devicePixelRatio % 1)) ? 'nearest' : 'linear';

export class Nitro implements INitro
{
    public static WEBGL_CONTEXT_LOST: string = 'NE_WEBGL_CONTEXT_LOST';
    public static WEBGL_UNAVAILABLE: string = 'NE_WEBGL_UNAVAILABLE';
    public static READY: string = 'NE_READY!';

    private static INSTANCE: INitro = null;

    private _application: Application;
    private _core: INitroCore;
    private _events: IEventDispatcher;
    private _communication: INitroCommunicationManager;
    private _localization: INitroLocalizationManager;
    private _avatar: IAvatarRenderManager;
    private _roomEngine: IRoomEngine;
    private _sessionDataManager: ISessionDataManager;
    private _roomSessionManager: IRoomSessionManager;
    private _roomManager: IRoomManager;
    private _cameraManager: IRoomCameraWidgetManager;
    private _soundManager: ISoundManager;
    private _linkTrackers: ILinkEventTracker[];

    private _isReady: boolean;
    private _isDisposed: boolean;

    // Pixi 8 se inicializa de forma asíncrona (app.init): el cliente espera a esto antes de cargar la configuración,
    // y todo lo que usa el renderer viene después de esa carga.
    public ready: Promise<void> = Promise.resolve();

    constructor(core: INitroCore)
    {
        if(!Nitro.INSTANCE) Nitro.INSTANCE = this;

        this._application = new PixiApplicationProxy();
        this._core = core;
        this._events = new EventDispatcher();
        this._communication = new NitroCommunicationManager(core.communication);
        this._localization = new NitroLocalizationManager(this._communication);
        this._avatar = new AvatarRenderManager();
        this._roomEngine = new RoomEngine(this._communication);
        this._sessionDataManager = new SessionDataManager(this._communication);
        this._roomSessionManager = new RoomSessionManager(this._communication, this._roomEngine);
        this._roomManager = new RoomManager(this._roomEngine, this._roomEngine.visualizationFactory, this._roomEngine.logicFactory);
        this._cameraManager = new RoomCameraWidgetManager();
        this._soundManager = new SoundManager();
        this._linkTrackers = [];

        this._isReady = false;
        this._isDisposed = false;

        this._core.configuration.events.addEventListener(ConfigurationEvent.LOADED, this.onConfigurationLoadedEvent.bind(this));
        this._roomEngine.events.addEventListener(RoomEngineEvent.ENGINE_INITIALIZED, this.onRoomEngineReady.bind(this));
    }

    public static bootstrap(): void
    {
        if(Nitro.INSTANCE)
        {
            Nitro.INSTANCE.dispose();

            Nitro.INSTANCE = null;
        }

        const canvas = document.createElement('canvas');

        // Lienzo OPACO, como Hobbaz (Pixi 8) y Hartico: Pixi 6 crea el contexto con alfa por defecto
        // y entonces el navegador y Windows lo mezclan con lo de detrás; al arrastrar la sala, cuando
        // la gráfica lo saca por un plano de superposición, salían tonos negros en el monitor que una
        // captura (OBS) no veía. La sala ya pinta su propio fondo negro, así que no cambia la imagen.
        const instance = new this(new NitroCore());

        const options: Partial<ApplicationOptions> = {
            // WebGL como el cliente de Pixi 6; WebGPU aún falla en bastantes navegadores.
            preference: 'webgl',
            backgroundAlpha: 1,
            autoDensity: false,
            width: window.innerWidth,
            height: window.innerHeight,
            resolution: window.devicePixelRatio,
            canvas,
            roundPixels: true,
            antialias: false,
            // Fotogramas sin pintarse antes de que Pixi borre una textura de la GPU (ver RoomContentLoader.purge).
            textureGCMaxIdle: 3600,
            // Como la beta de Hobbaz: lo que no se usa en un minuto se libera, mirando cada 10 s (por defecto cada 30).
            gcMaxUnusedTime: 60000,
            gcFrequency: 10000,
            // Nitro lleva el ratón con eventos del DOM sobre el canvas: el sistema de eventos de Pixi solo gastaría CPU
            // buscando bajo el cursor en cada movimiento, y la accesibilidad (tabulador) no se usa.
            eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
            accessibilityOptions: { activateOnTab: false }
        };

        instance.ready = instance._application.init(options).then(() =>
        {
            const renderer = instance._application.renderer as WebGLRenderer;
            const subtract = () => NitroBlendMode.registerSubtract(renderer.gl, (renderer.state as unknown as { blendModesMap: Record<string, number[]> })?.blendModesMap);

            subtract();

            // al recuperar el contexto Pixi rehace su tabla de mezclas
            renderer.runners?.contextChange?.add({ contextChange: subtract });

            // Pintar un contenedor dentro de una textura lo convierte en grupo de render, y Pixi 8 guarda un Batcher
            // (con búferes de GPU) por grupo que solo suelta al destruirlo. Nitro pinta miles de contenedores
            // temporales (paredes, suelos, avatares, miniaturas) sin destruirlos: +60 MB de JS por cada pocas salas.
            // Si no era grupo antes de pintarlo en una textura, se le quita al terminar (cubre generateTexture y extract).
            const pintar = renderer.render.bind(renderer) as (options: any, deprecated?: any) => void;

            (renderer as { render: (options: any, deprecated?: any) => void }).render = (options: any, deprecated?: any) =>
            {
                const container = options?.container;
                const temporal = !!(container && options.target && !container.isRenderGroup);

                // Con una matriz, Pixi 6 la aplicaba ENCIMA de la posición propia del objeto; Pixi 8 la sustituye.
                // Nitro cuenta con lo primero (p. ej. las caras del editor de avatar se bajan 10 px antes de
                // pasarlas a imagen, y generateTexture siempre pasa una matriz para encuadrar).
                if(container && options.transform && !container.isRenderGroup)
                {
                    container.updateLocalTransform();

                    options = { ...options, transform: options.transform.clone().append(container.localTransform) };
                }

                pintar(options, deprecated);

                if(temporal && container.isRenderGroup && !container.destroyed) container.disableRenderGroup();
            };
        });

        canvas.addEventListener('webglcontextlost', () => instance.events.dispatchEvent(new NitroEvent(Nitro.WEBGL_CONTEXT_LOST)));
    }

    public init(): void
    {
        if(this._isReady || this._isDisposed) return;

        if(this._avatar) this._avatar.init();

        if(this._soundManager) this._soundManager.init();

        if(this._roomEngine)
        {
            this._roomEngine.sessionDataManager = this._sessionDataManager;
            this._roomEngine.roomSessionManager = this._roomSessionManager;
            this._roomEngine.roomManager = this._roomManager;

            if(this._sessionDataManager) this._sessionDataManager.init();
            if(this._roomSessionManager) this._roomSessionManager.init();

            this._roomEngine.init();
        }

        if(!this._communication.connection)
        {
            throw new Error('No connection found');
        }

        new GameMessageHandler(this._communication.connection);

        this._isReady = true;
    }

    public dispose(): void
    {
        if(this._isDisposed) return;

        if(this._roomManager)
        {
            this._roomManager.dispose();

            this._roomManager = null;
        }

        if(this._roomSessionManager)
        {
            this._roomSessionManager.dispose();

            this._roomSessionManager = null;
        }

        if(this._sessionDataManager)
        {
            this._sessionDataManager.dispose();

            this._sessionDataManager = null;
        }

        if(this._roomEngine)
        {
            this._roomEngine.dispose();

            this._roomEngine = null;
        }

        if(this._avatar)
        {
            this._avatar.dispose();

            this._avatar = null;
        }

        if(this._soundManager)
        {
            this._soundManager.dispose();

            this._soundManager = null;
        }

        if(this._communication)
        {
            this._communication.dispose();

            this._communication = null;
        }

        if(this._application)
        {
            this._application.destroy();

            this._application = null;
        }

        this._isDisposed = true;
        this._isReady = false;
    }

    private onConfigurationLoadedEvent(event: ConfigurationEvent): void
    {
        GetTicker().maxFPS = NitroConfiguration.getValue<number>('system.fps.max', 24);

        NitroLogger.LOG_DEBUG = NitroConfiguration.getValue<boolean>('system.log.debug', true);
        NitroLogger.LOG_WARN = NitroConfiguration.getValue<boolean>('system.log.warn', false);
        NitroLogger.LOG_ERROR = NitroConfiguration.getValue<boolean>('system.log.error', false);
        NitroLogger.LOG_EVENTS = NitroConfiguration.getValue<boolean>('system.log.events', false);
        NitroLogger.LOG_PACKETS = NitroConfiguration.getValue<boolean>('system.log.packets', false);

        LandscapeRasterizer.LANDSCAPES_ENABLED = NitroConfiguration.getValue<boolean>('room.landscapes.enabled', true);
    }

    private onRoomEngineReady(event: RoomEngineEvent): void
    {
        this.startSendingHeartBeat();
    }

    public getConfiguration<T>(key: string, value: T = null): T
    {
        return NitroConfiguration.getValue<T>(key, value);
    }

    public getLocalization(key: string): string
    {
        return this._localization.getValue(key);
    }

    public getLocalizationWithParameter(key: string, parameter: string, replacement: string): string
    {
        return this._localization.getValueWithParameter(key, parameter, replacement);
    }

    public getLocalizationWithParameters(key: string, parameters: string[], replacements: string[]): string
    {
        return this._localization.getValueWithParameters(key, parameters, replacements);
    }

    public addLinkEventTracker(tracker: ILinkEventTracker): void
    {
        if(this._linkTrackers.indexOf(tracker) >= 0) return;

        this._linkTrackers.push(tracker);
    }

    public removeLinkEventTracker(tracker: ILinkEventTracker): void
    {
        const index = this._linkTrackers.indexOf(tracker);

        if(index === -1) return;

        this._linkTrackers.splice(index, 1);
    }

    public createLinkEvent(link: string): void
    {
        if(!link || (link === '')) return;

        for(const tracker of this._linkTrackers)
        {
            if(!tracker) continue;

            const prefix = tracker.eventUrlPrefix;

            if(prefix.length > 0)
            {
                if(link.substr(0, prefix.length) === prefix) tracker.linkReceived(link);
            }
            else
            {
                tracker.linkReceived(link);
            }
        }
    }

    private startSendingHeartBeat(): void
    {
        this.sendHeartBeat();

        setInterval(this.sendHeartBeat, 10000);
    }

    private sendHeartBeat(): void
    {
        HabboWebTools.sendHeartBeat();
    }

    public get application(): Application
    {
        return this._application;
    }

    public get core(): INitroCore
    {
        return this._core;
    }

    public get events(): IEventDispatcher
    {
        return this._events;
    }

    public get localization(): INitroLocalizationManager
    {
        return this._localization;
    }

    public get communication(): INitroCommunicationManager
    {
        return this._communication;
    }

    public get avatar(): IAvatarRenderManager
    {
        return this._avatar;
    }

    public get roomEngine(): IRoomEngine
    {
        return this._roomEngine;
    }

    public get sessionDataManager(): ISessionDataManager
    {
        return this._sessionDataManager;
    }

    public get roomSessionManager(): IRoomSessionManager
    {
        return this._roomSessionManager;
    }

    public get roomManager(): IRoomManager
    {
        return this._roomManager;
    }

    public get cameraManager(): IRoomCameraWidgetManager
    {
        return this._cameraManager;
    }

    public get soundManager(): ISoundManager
    {
        return this._soundManager;
    }

    public get width(): number
    {
        return this._application.renderer.width;
    }

    public get height(): number
    {
        return this._application.renderer.height;
    }

    public get isReady(): boolean
    {
        return this._isReady;
    }

    public get isDisposed(): boolean
    {
        return this._isDisposed;
    }

    public static get instance(): INitro
    {
        return this.INSTANCE || null;
    }
}
