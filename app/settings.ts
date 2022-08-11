import * as I from './definitions';
import * as logger from './logger';
import { MediaType, TabLoadOrder, TabLoadType } from './enums';

// Do not introduce settings unless they are used, in order to avoid introducing bad default settings.
export const DefaultSiteSettings: I.SiteSettings = {
    autoFullscreen: false,
    fullscreenScrollGestureEnabled: false,
    downloadPath: "raccoony/{siteName}/{author}/{submissionId}_{filename}_by_{author}.{extension}",
    hotkeysEnabled: true,
    tabLoadDelay: 1,
    tabLoadSortBy: TabLoadOrder.Date,
    tabLoadSortAsc: true,
    tabLoadType: TabLoadType.Timer,
    writeMetadata: false,
    autoDownload: false,
    contextDownloadPath: "raccoony/{siteName}/{author}/{isoDate}t{isoTime}_{filenameExt}",
};

export const DefaultExtensionSettings: I.ExtensionSettings = {
    showContextMenu: true,
    switchToNewTab: true,
};

const DefaultSettingsKey = 'default_settings';

const settingsVersion = 4;

export function getSiteKeyFromName(siteName: string) {
    return siteName.endsWith('_settings') ? siteName : `${siteName}_settings`;
}

export function getAllSettings(): Promise<I.AllSettings> {
    return browser.storage.local.get(null)
        .then((storage) => {
            const settings = storage as any as I.AllSettings;
            if (!settings) {
                // If settings haven't been migrated, perform the migration
                return migrateSettingsFromSyncToLocal()
                    .then(() => browser.storage.local.get(null) as any as I.AllSettings);
            }
            else if ((settings.version || 0) < settingsVersion) {
                return upgradeSettings(settings)
                    .then(() => browser.storage.local.get(null) as any as I.AllSettings);
            }
            return settings;
        })
        .then((settings) => {
            logger.log("retrieved settings:", settings);
            return settings;
        })
        .catch((e) => {
            logger.error('error getting settings', e)
            return Promise.reject(e);
        });
}

export function getSettings(siteKey: string): Promise<I.Settings> {
    siteKey = getSiteKeyFromName(siteKey);
    return getAllSettings()
        .then(store => {
            if (store.default_settings && !store.default_settings.downloadPath) {
                delete store.default_settings.downloadPath;
            }
            const settings: I.Settings = {
                siteKey,
                defaultSettings: Object.assign({}, DefaultSiteSettings, store.default_settings),
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
    let settingsToSave: Partial<I.AllSettings> = {
        default_settings: defaultSettings
    };
    settingsToSave[siteKey] = currentSettings;
    return saveAllSettings(settingsToSave);
}

export function saveDefaultSettings(defaultSettings: I.SiteSettings): Promise<void> {
    const settings: Partial<I.AllSettings> = {
        default_settings: defaultSettings
    }
    return saveAllSettings(settings);
}

export function saveExtensionSettings(extensionSettings: I.ExtensionSettings) {
    const settings: Partial<I.PrimarySettings> = {
        extension: extensionSettings,
    }
    return saveAllSettings(settings);
}

export function saveAllSettings(settings: Partial<I.AllSettings> | Partial<I.PrimarySettings>): Promise<void> {
    return browser.storage.local.set(settings as any)
        .then(() => logger.log("settings saved", settings))
        .catch((e) => {
            logger.log('error saving settings', e)
            return Promise.reject<void>(e);
        });
}

export function clearDefaultSettings() {
    return saveDefaultSettings(null);
}

export function clearAllSettings() {
    return browser.storage.local.clear();
}

function migrateSettingsFromSyncToLocal(): Promise<I.AllSettings> {
    return browser.storage.sync.get(null)
        .then((storage) => {
            const settings = Object.assign({}, storage) as any as I.AllSettings;
            settings.version = settingsVersion;
            logger.log('migrating settings from sync storage', storage, settings);
            return saveAllSettings(settings)
                .then(() => browser.storage.sync.clear())
                .then(() => settings);
        });
}

function upgradeSettings(settings: I.AllSettings) {
    if (settings.version === 1) {
        upgradeV1Settings(settings);
    }
    if (settings.version < 4) {
        upgradeSettingsToV4(settings);
    }
    settings.version = settingsVersion;
    return saveAllSettings(settings);
}

function upgradeV1Settings(settings: I.AllSettings) {
    // Filter out any property set to null.
    const keys = Object.getOwnPropertyNames(settings)
        .filter(key => key.endsWith('_settings'));
    keys.forEach(key => {
        const siteSetting = settings[key];
        const skeys = Object.getOwnPropertyNames(siteSetting);
        skeys.filter(k => siteSetting[k] == null)
            .forEach(k => {
                delete siteSetting[k];
            });
    });
}

function upgradeSettingsToV4(settings: I.AllSettings) {
    // Reset the default TabLoadType
    if (settings.default_settings?.tabLoadType != null) {
        settings.default_settings.tabLoadType = DefaultSiteSettings.tabLoadType;
    }
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

    getExtensionSettings(): I.ExtensionSettings {
        return Object.assign({}, DefaultExtensionSettings, this.settings.extension);
    }

    getSettings(siteKey: string) {
        siteKey = getSiteKeyFromName(siteKey);
        const settings: I.Settings = {
            siteKey,
            defaultSettings: this.getDefaultSettings(),
            currentSettings: Object.assign({}, this.settings[siteKey]) || {}
        };
        return settings;
    }

    getCurrentSettings(siteKey: string) {
        siteKey = getSiteKeyFromName(siteKey);
        const settings = this.getSettings(siteKey);
        return Object.assign({}, settings.defaultSettings, settings.currentSettings);
    }

    getDefaultSettings() {
        return Object.assign({}, DefaultSiteSettings, this.settings.default_settings);
    }

    addListener(listener: SettingsListener) {
        this.listeners.push(listener);
    }

    removeListener(listener: SettingsListener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private onSettingsChange = () => {
        logger.log('detected settings change, reloading')
        this.settingsPromise = getAllSettings()
            .then(settings => {
                if (settings.default_settings && !settings.default_settings.downloadPath) {
                    // Fix a screwup with old settings set to null
                    delete settings.default_settings.downloadPath;
                }
                this.settings = settings;
                this.listeners.forEach(listener => listener(this));
            });
    }
}