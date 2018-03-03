declare module 'messageformat' {

    type CustomFormatter = (variable: string, locale: string, args?: string | string[]) => string;

    type CompiledFormatter = (variables: {
        [variable: string]: (string | number | Date)
    }) => string;

    type MessagesObject = { [key: string]: string | MessagesObject }

    export default class MessageFormat {
        constructor(locale?: string);
        defaultLocale: string;
        escape(str: string): string;
        addFormatters(formatters: { [formatterName: string]: CustomFormatter }): MessageFormat;
        compile(messages: string | MessagesObject, locale?: string): CompiledFormatter;
        disablePluralKeyChecks(): MessageFormat;
        setBiDiSupport(enable?: boolean): MessageFormat;
        setIntlSupport(enable?: boolean): MessageFormat;
        setStrictNumberSign(enable?: boolean): MessageFormat;
    }
}