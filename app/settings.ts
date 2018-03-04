import * as I from './definitions';
import * as logger from './logger';
import { MediaType, TabLoadOrder } from './enums';

// Do not introduce settings unless they are used, in order to avoid introducing bad default settings.
const defaultSiteSettings: I.SiteSettings = {
    autoFullscreen: false,
    fullscreenScrollGestureEnabled: false,
    downloadPath: "raccoony/{siteName}/{author}/{submissionId}_{filename}_by_{author}.{extension}",
    hotkeysEnabled: true,
    tabLoadDelay: 1,
    tabLoadSortBy: TabLoadOrder.Date,
    tabLoadSortAsc: true,
    writeMetadata: false,
};

const DefaultSettingsKey = 'default_settings';

export function getSiteKeyFromName(siteName: string) {
    return siteName.endsWith('_settings') ? siteName : `${siteName}_settings`;
}

export function getAllSettings(): Promise<I.AllSettings> {
    return browser.storage.sync.get(null)
        .then((settings) => {
            logger.log("retrieved settings:", settings);
            return settings;
        })
        .catch((e) => {
            logger.error('error getting settings', e)
            return Promise.reject(e);
        }) as any as Promise<I.AllSettings>;
}

export function getSettings(siteKey: string): Promise<I.Settings> {
    siteKey = getSiteKeyFromName(siteKey);
    return getAllSettings()
        .then(store => {
            if (!store.default_settings.downloadPath) {
                delete store.default_settings.downloadPath;
            }
            const settings: I.Settings = {
                siteKey,
                defaultSettings: Object.assign({}, defaultSiteSettings, store.default_settings),
                currentSettings: store[siteKey] || {}
            };
            logger.log(`retrieved site settings for ${siteKey}`, settings);
            return settings;
        });
}

export function getCurrentSettings(siteKey: string): Promise<I.SiteSettings> {
    siteKey = getSiteKeyFromName(siteKey);
    return getSettings(siteKey)
        .then((store) => {
            return Object.assign({}, store.defaultSettings, store.currentSettings);
        });
}

export function saveSettings(settings: I.Settings): Promise<void> {
    const { defaultSettings, currentSettings, siteKey } = settings;
    let settingsToSave: I.AllSettings = {
        default_settings: defaultSettings
    };
    settingsToSave[siteKey] = currentSettings;
    return saveAllSettings(settingsToSave);
}

export function saveAllSettings(settings: I.AllSettings): Promise<void> {
    return browser.storage.sync.set(settings as any)
        .then(() => logger.log("settings saved, keys:", Object.getOwnPropertyNames(settings)))
        .catch((e) => {
            logger.log('error saving settings', e)
            return Promise.reject<void>(e);
        });
}


type SettingsListener = (settings: CachedSettings) => void;

export class CachedSettings {
    settings: I.AllSettings;
    listeners: Array<SettingsListener> = []

    private settingsPromise: Promise<void>;

    constructor() {
        this.onSettingsChange();
        browser.storage.onChanged.addListener(this.onSettingsChange);
    }

    get ready() {
        return this.settingsPromise;
    }

    getSettings(siteKey: string) {
        siteKey = getSiteKeyFromName(siteKey);
        const settings: I.Settings = {
            siteKey,
            defaultSettings: Object.assign({}, defaultSiteSettings, this.settings.default_settings),
            currentSettings: Object.assign({}, this.settings[siteKey]) || {}
        };
        return settings;
    }

    getCurrentSettings(siteKey: string) {
        siteKey = getSiteKeyFromName(siteKey);
        const settings = this.getSettings(siteKey);
        return Object.assign({}, settings.defaultSettings, settings.currentSettings);
    }

    addListener(listener: SettingsListener) {
        this.listeners.push(listener);
    }

    removeListener(listener: SettingsListener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private onSettingsChange = () => {
        this.settingsPromise = getAllSettings()
            .then(settings => {
                if (!settings.default_settings.downloadPath) {
                    // Fix a screwup with old settings set to null
                    delete settings.default_settings.downloadPath;
                }
                this.settings = settings;
                this.listeners.forEach(listener => listener(this));
            });
    }
}