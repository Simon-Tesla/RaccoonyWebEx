import * as I from '../definitions';
import * as logger from '../logger';
import { MediaType, TabLoadOrder } from '../enums';
import * as Settings from '../settings';
import { getFileTypeByExt } from '../utils/filenames';
import { Media } from '../definitions';

//TODO: rename this to something like SiteDataProvider
export default class SiteActions {
    private plugin: I.SitePlugin;

    constructor(plugin: I.SitePlugin) {
        this.plugin = plugin;
    }

    get siteName() {
        return this.plugin.siteName;
    }

    private get settingsKey() {
        return `${this.siteName}_settings`;
    }

    getMedia(): Promise<I.Media> {
        return this.plugin.getMedia()
            .then(media => {
                if (media) {
                    if (media.extension && !media.type) {
                        media.type = getFileTypeByExt(media.extension);
                    }
                    media.siteName = this.siteName;
                    media.sourceUrl = window.location.href;
                    media.siteFilename = media.siteFilename || `${media.filename}.${media.extension}`;
                    media.previewUrl = media.previewUrl || media.url;
                    media.author = media.author || "unknown";
                }
                return media;
            })
    }

    async getMediaForSrcUrl(srcUrl: string, mediaType: MediaType) {
        const defaultMedia: Media = {
            url: srcUrl,
            // If we can't figure anything out, at least normalize the site name.
            siteName: this.plugin.siteName,
        };
        try {
            let media = await this.plugin.getMediaForSrcUrl(srcUrl, mediaType);
            if (!media) {
                // If we didn't get anything when specifying an explicit source URL,
                // try the normal getMedia call and use it if its url matches srcUrl.
                media = await this.plugin.getMedia();
                return media && media.url === srcUrl ? media : defaultMedia;
            }
            return media;
        }
        catch (err) {
            logger.error("[getMediaForSrcUrl] error:", err);
            return defaultMedia;
        }
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        return this.plugin.getPageLinkList()
            .then(list => {
                if (list) {
                    list.siteName = this.siteName;
                }
                return list;
            })
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

    saveSettings(settings: I.Settings): Promise<void> {
        return Settings.saveSettings({
            siteKey: this.settingsKey,
            ...settings
        });
    }
}