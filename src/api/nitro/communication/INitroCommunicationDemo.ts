import { INitroManager } from '../../common';

/** ultimaLatencia: el último ping medido en ms (-1 sin medir), para el monitor de la HK */
export type INitroCommunicationDemo = INitroManager & { readonly ultimaLatencia?: number };
