export class NitroVersion
{
    public static RENDERER_VERSION: string = '1.6.6';
    public static UI_VERSION: string = '';

    /** El saludo de la consola (F12), como el de Hartico pero de Habb y con nuestro Discord. */
    public static sayHello(): void
    {
        if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
        {
            const blanco = 'background: #ffffff; padding:5px 0;';

            self.console.log(
                '\n %c %c Nitro & Renderer Custom - By Habb.tv %c %c \n\n',
                blanco,
                'color: #ffffff; background: #6c1a8f; padding:5px 0; font-weight: bold;',
                blanco,
                'background: transparent;'
            );
            self.console.log('%c Discord: https://discord.gg/dcSpfjfqe ', 'color: #ffffff; background: #5865f2; padding:4px 2px; border-radius: 3px;');
        }

        else if(self.console)
        {
            self.console.log('Nitro & Renderer Custom - By Habb.tv · Discord: https://discord.gg/dcSpfjfqe');
        }
    }
}
