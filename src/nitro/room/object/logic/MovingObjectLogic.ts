import { IRoomObjectController, IRoomObjectUpdateMessage, IVector3D, RoomObjectVariable, Vector3d } from '../../../../api';
import { RoomObjectLogicBase } from '../../../../room';
import { ObjectMoveUpdateMessage } from '../../messages';

export class MovingObjectLogic extends RoomObjectLogicBase
{
    public static DEFAULT_UPDATE_INTERVAL: number = 500;
    private static TEMP_VECTOR: Vector3d = new Vector3d();

    private _liftAmount: number;

    private _location: Vector3d;
    private _locationDelta: Vector3d;
    private _lastUpdateTime: number;
    private _changeTime: number;
    private _updateInterval: number;
    private _curve: number = 0;
    private _intensity: number = 0;
    private _arc: number = 0;
    private _styled: boolean = false;

    constructor()
    {
        super();

        this._liftAmount = 0;

        this._location = new Vector3d();
        this._locationDelta = new Vector3d();
        this._lastUpdateTime = 0;
        this._changeTime = 0;
        this._updateInterval = MovingObjectLogic.DEFAULT_UPDATE_INTERVAL;
    }

    protected onDispose(): void
    {
        this._liftAmount = 0;

        super.onDispose();
    }

    public update(time: number): void
    {
        super.update(time);

        const locationOffset = this.getLocationOffset();
        const model = this.object && this.object.model;

        if(model)
        {
            if(locationOffset)
            {
                if(this._liftAmount !== locationOffset.z)
                {
                    this._liftAmount = locationOffset.z;

                    model.setValue(RoomObjectVariable.FURNITURE_LIFT_AMOUNT, this._liftAmount);
                }
            }
            else
            {
                if(this._liftAmount !== 0)
                {
                    this._liftAmount = 0;

                    model.setValue(RoomObjectVariable.FURNITURE_LIFT_AMOUNT, this._liftAmount);
                }
            }
        }

        if((this._locationDelta.length > 0) || locationOffset)
        {
            const vector = MovingObjectLogic.TEMP_VECTOR;

            let difference = (this.time - this._changeTime);

            if(difference === (this._updateInterval >> 1)) difference++;

            if(difference > this._updateInterval) difference = this._updateInterval;

            if(this._locationDelta.length > 0)
            {
                const t = (difference / this._updateInterval);

                vector.assign(this._locationDelta);
                vector.multiply(MovingObjectLogic.ease(t, this._curve, this._intensity));
                vector.add(this._location);

                // Proyectil con curva: se aparta a un lado del trazo y vuelve (seno), en baldosas
                if(this._arc)
                {
                    const dx = this._locationDelta.x, dy = this._locationDelta.y;
                    const len = Math.sqrt((dx * dx) + (dy * dy));

                    if(len > 0)
                    {
                        const k = Math.sin(Math.PI * t) * (this._arc / 1000) * len * 0.5;

                        vector.x += (-dy / len) * k;
                        vector.y += (dx / len) * k;
                    }
                }
            }
            else
            {
                vector.assign(this._location);
            }

            if(locationOffset) vector.add(locationOffset);

            this.object.setLocation(vector);

            if(difference === this._updateInterval)
            {
                this._locationDelta.x = 0;
                this._locationDelta.y = 0;
                this._locationDelta.z = 0;
            }
        }

        this._lastUpdateTime = this.time;
    }

    public setObject(object: IRoomObjectController): void
    {
        super.setObject(object);

        if(object) this._location.assign(object.getLocation());
    }

    public processUpdateMessage(message: IRoomObjectUpdateMessage): void
    {
        if(!message) return;

        // Una posición normal (no de deslizamiento) en pleno deslizamiento. El servidor
        // manda el estado nuevo de un furni que un wired cambia Y mueve a la vez con su
        // posición final, justo detrás del deslizamiento: antes eso movía el ORIGEN al
        // destino sin anular el desplazamiento pendiente, y el furni seguía de largo otro
        // tanto y se quedaba ahí hasta recargar (la bola del bingo, 06-10-2026).
        if(message.location && !(message instanceof ObjectMoveUpdateMessage) && (this._locationDelta.length > 0))
        {
            const destino = MovingObjectLogic.TEMP_VECTOR;

            destino.assign(this._location);
            destino.add(this._locationDelta);

            const mismoSitio = (Math.abs(destino.x - message.location.x) < 0.01) && (Math.abs(destino.y - message.location.y) < 0.01) && (Math.abs(destino.z - message.location.z) < 0.01);

            if(mismoSitio)
            {
                // ya va hacia ahí: que termine de deslizarse
                if(this.object && message.direction) this.object.setDirection(message.direction);

                return;
            }

            // a otro sitio: se corta el deslizamiento y se planta donde dice el servidor
            this._locationDelta.assign(new Vector3d());
        }

        super.processUpdateMessage(message);

        if(message.location) this._location.assign(message.location);

        if(message instanceof ObjectMoveUpdateMessage) return this.processMoveMessage(message);
    }

    private processMoveMessage(message: ObjectMoveUpdateMessage): void
    {
        if(!message || !this.object || !message.location) return;

        this._changeTime = this._lastUpdateTime;

        const style = message.style;

        if(style && (style.duration > 0))
        {
            this.updateInterval = style.duration;
            this._curve = style.curve;
            this._intensity = style.intensity;
            this._arc = style.arc || 0;
            this._styled = true;
        }
        else if(this._styled)
        {
            this.updateInterval = MovingObjectLogic.DEFAULT_UPDATE_INTERVAL;
            this._curve = 0;
            this._arc = 0;
            this._styled = false;
        }

        this._locationDelta.assign(message.targetLocation);
        this._locationDelta.subtract(this._location);
    }

    /** Curvas de «Curva de Movimiento» (Octane): 0 lineal · 1 entrada · 2 salida · 3 entrada y salida · 4 rebote · 5 elástica · 6 caída. */
    public static ease(t: number, curve: number, intensity: number): number
    {
        if(!curve || (t <= 0) || (t >= 1)) return t;

        let e = t;

        switch(curve)
        {
            case 1: e = t * t; break;
            case 2: e = 1 - ((1 - t) * (1 - t)); break;
            case 3: e = (t < 0.5) ? (2 * t * t) : (1 - (Math.pow(-2 * t + 2, 2) / 2)); break;
            case 4: {
                let u = t;
                const n = 7.5625, d = 2.75;

                if(u < (1 / d)) e = n * u * u;
                else if(u < (2 / d)) { u -= (1.5 / d); e = (n * u * u) + 0.75; }
                else if(u < (2.5 / d)) { u -= (2.25 / d); e = (n * u * u) + 0.9375; }
                else { u -= (2.625 / d); e = (n * u * u) + 0.984375; }
                break;
            }
            case 5: e = (Math.pow(2, -10 * t) * Math.sin(((t * 10) - 0.75) * ((2 * Math.PI) / 3))) + 1; break;
            case 6: e = t * t * t; break;
        }

        const k = Math.max(0, Math.min(100, intensity)) / 100;

        return t + ((e - t) * k);
    }

    protected getLocationOffset(): IVector3D
    {
        return null;
    }

    protected get lastUpdateTime(): number
    {
        return this._lastUpdateTime;
    }

    protected set updateInterval(interval: number)
    {
        if(interval <= 0) interval = 1;

        this._updateInterval = interval;
    }
}
