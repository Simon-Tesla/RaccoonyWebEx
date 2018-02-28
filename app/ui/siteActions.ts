import * as I from '../definitions';
import * as logger from '../logger';
import { MediaType, TabLoadOrder } from '../enums';

export const defaultSiteSettings: I.SiteSettings = {
    autoFullscreen: false,
    fullscreenScrollGestureEnabled: false,
    downloadPath: null,
    hotkeysEnabled: true,
    tabLoadDelay: 1,
    tabLoadSortBy: TabLoadOrder.Date,
    tabLoadSortAsc: true,
    writeMetadata: false,
};

const DefaultSettingsKey = 'default_settings';

//TODO: rename this to something like AppDataProvider
export default class SiteActions {
    private plugin: I.SitePlugin;

    constructor(plugin: I.SitePlugin) {
        this.plugin = plugin;
    }

    private get siteName() {
        return this.plugin.siteName;
    }

    private get settingsKey() {
        return `${this.siteName}_settings`;
    }

    getMedia(): Promise<I.Media> {
        return this.plugin.getMedia();
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        return this.plugin.getPageLinkList();
    }

    hasMedia(): Promise<boolean> {
        return this.plugin.hasMedia()
            .catch(err => {
                // Swallow errors
                logger.error("[hasMedia] error: ", err);
                return Promise.resolve(false);
            });
    }

    hasPageLinkList(): Promise<boolean> {
        return this.plugin.hasPageLinkList()
            .catch(err => {
                // Swallow errors
                logger.error("[hasPageLinkList] error: ", err);
                return Promise.resolve(false);
            });
    }

    registerPageChangeHandler(handler: () => void): void {
        return this.plugin.registerPageChangeHandler(handler);
    }

    getSettings(): Promise<{ defaultSettings: I.SiteSettings; currentSettings: I.SiteSettings; }> {
        const keys = [this.settingsKey, DefaultSettingsKey];
        return browser.storage.sync.get(keys).then((settings) => {
            let defaultSettings: I.SiteSettings = <any>settings[DefaultSettingsKey] || defaultSiteSettings;
            let currentSettings: I.SiteSettings = <any>settings[this.settingsKey] || {};
            logger.log(`${this.siteName} loaded all settings`, currentSettings, defaultSettings);
            return {
                defaultSettings,
                currentSettings,
            };
        }).catch((e) => {
            logger.log('error getting settings', e)
            return Promise.reject(e);
        });
    }

    getCurrentSettings(): Promise<I.SiteSettings> {
        return this.getSettings()
            .then((store) => {
                return Object.assign({}, store.defaultSettings, store.currentSettings);
            });
    }

    saveSettings(settings: { defaultSettings?: I.SiteSettings; currentSettings?: I.SiteSettings; }): Promise<void> {
        const { defaultSettings, currentSettings } = settings;
        return this.getSettings()
            .then((store) => {
                let settingsToSave: any = {};
                if (defaultSettings) {
                    settingsToSave[DefaultSettingsKey] = Object.assign({}, store.defaultSettings, defaultSettings);
                }
                if (currentSettings) {
                    settingsToSave[this.settingsKey] = Object.assign({}, store.currentSettings, currentSettings);
                }
                return browser.storage.sync.set(settingsToSave);
            })
            .then(() => logger.log(`${this.siteName} settings saved.`))
            .catch((e) => {
                logger.log('error saving settings', e)
                return Promise.reject(e);
            });
    }
}