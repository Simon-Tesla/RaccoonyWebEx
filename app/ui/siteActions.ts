import * as I from '../definitions';
import * as logger from '../logger';
import { MediaType, TabLoadOrder, DownloadDestination } from '../enums';
import * as Settings from '../settings';
import { getFileTypeByExt } from '../utils/filenames';
import { Media } from '../definitions';
import { getFilenameParts, isValidExtension, getExtensionFromMimeType } from '../utils/file';

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

    async getMediaForSrcUrl(srcUrl: string, mediaType: MediaType): Promise<I.Media> {
        const defaultMedia: I.Media = {
            url: srcUrl,
            type: mediaType,
            siteName: this.siteName,
            sourceUrl: window.location.href,
            downloadDestination: DownloadDestination.ContextMenuDefault
        };
        let media = Object.assign({}, defaultMedia);

        try {
            media = await this.plugin.getMediaForSrcUrl(srcUrl, mediaType);
            if (!media) {
                // If we didn't get anything when specifying an explicit source URL,
                // try the normal getMedia call and use it if its url matches srcUrl.
                media = await this.plugin.getMedia();
                media = media && media.url === srcUrl ? media : null;
                if (media) {
                    media.downloadDestination = DownloadDestination.Default;
                }
            }
            media = Object.assign({}, defaultMedia, media);
        }
        catch (err) {
            // Swallow the error and attempt to go on with what we have so far.
            logger.error("[getMediaForSrcUrl] error:", err, media);
        }
        return await ensureMediaHasFilenameAndExtension(media);
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


async function ensureMediaHasFilenameAndExtension(media: Media) {
    const itemUrl = new URL(media.url);
    const itemFile = itemUrl.pathname.split('/').pop();

    media = Object.assign({
        siteFilename: itemFile
    }, media);

    const { filename, ext } = getFilenameParts(media.siteFilename);
    media.filename = media.filename || filename;

    if (!media.extension) {
        // Try to figure out the file's proper extension
        if (isValidExtension(ext, media.type)) {
            // Try to use the extension in the filename if it is present.
            media.extension = ext;
        }
        else {
            try {
                // Failing that, try to get the mime-type of the file by looking at the request headers
                const response = await fetch(media.url)
                const mimeType = response.headers.get('Content-Type');
                logger.log('fetching file to determine extension', mimeType, response);
                if (response.ok) {
                    media.extension = getExtensionFromMimeType(mimeType);
                }
            }
            catch (e) {
                // swallow exceptions
            }
        }
    }
    return media;
}