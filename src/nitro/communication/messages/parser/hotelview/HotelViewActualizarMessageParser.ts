import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Portada: la HK ha publicado cambios (sin datos: el cliente vuelve a pedir /api/hotelview). */
export class HotelViewActualizarMessageParser implements IMessageParser
{
    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        return !!wrapper;
    }
}
