import * as I from '../definitions';

class SiteActions implements I.SitePlugin {
    siteName: string;
    getMedia(): Promise<I.Media> {
        throw new Error("Method not implemented.");
    }
    getPageLinkList(): Promise<I.PageLinkList> {
        throw new Error("Method not implemented.");
    }
    hasMedia(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    hasPageLinkList(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    registerPageChangeHandler(handler: () => void): void {
        throw new Error("Method not implemented.");
    }
    getSettings(noDefaults?: boolean): Promise<I.SiteSettings> {
        throw new Error("Method not implemented.");
    }
    saveSettings(settings: I.SiteSettings): Promise<void> {
        throw new Error("Method not implemented.");
    }
    //TODO: wrap site plugin, provide methods for saving settings etc.

}