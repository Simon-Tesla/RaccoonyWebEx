import * as I from '../definitions';
import * as logger from '../logger';
import { MediaType, TabLoadOrder, DownloadDestination } from '../enums';
import * as Settings from '../settings';
import { getFileTypeByExt } from '../utils/file';
import { Media } from '../definitions';
import { getFilenameParts, isValidExtensionForType, getExtensionFromMimeType, isValidExtension } from '../utils/file';

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

    async checkFileDownload(): Promise<I.Media> {
        let media = await this.plugin.checkFileDownload();
        return this.postProcessMediaData(media);
    }

    async getMedia(): Promise<I.Media> {
        let media = await this.plugin.getMedia();
        return this.postProcessMediaData(media);
    }

    async postProcessMediaData(media: I.Media): Promise<I.Media> {
        // TODO: this should probably be moved into the base plugin?
        if (media) {
            const hasSiteFilename = !!media.siteFilename;
            media = await ensureMediaHasFilenameAndExtension(media);
            media.siteName = this.siteName;

            // If a plugin explicitly set sourceUrl, use that; otherwise
            // use window.location.href.  As of 2020-03, only the e621
            // plugin sets sourceUrl, so it can provide a URL without the
            // search terms appended.
            const sourceUrlNotProvided = !media.sourceUrl;
            if (sourceUrlNotProvided) {
                media.sourceUrl = window.location.href;
            }

            if (!hasSiteFilename) {
                // To avoid breaking compatibility with old filename behavior, we override the siteFilename returned
                // by ensureMediaHasFilenameAndExtension() if one wasn't returned by the site plugin.
                media.siteFilename = `${media.filename}.${media.extension}`;
            }
            media.previewUrl = media.previewUrl || media.url;
            media.author = media.author || "unknown";
            return media;
        }
        return null;
    }

    async getMediaForSrcUrl(srcUrl: string, mediaType: MediaType): Promise<I.Media> {
        const defaultMedia: I.Media = {
            url: srcUrl,
            type: mediaType,
            siteName: this.siteName,
            sourceUrl: window.location.href,
            downloadDestination: DownloadDestination.ContextMenuDefault,
            author: null,
            filename: null,
            extension: null,
            title: null,
            description: null,
            tags: null,
            submissionId: null,
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
    if (!media.siteFilename) {
        // Construct the siteFilename from the image URL if it isn't specified
        const itemUrl = new URL(media.url);
        media.siteFilename = itemUrl.pathname.split('/').pop();
    }

    const { filename, ext } = getFilenameParts(media.siteFilename);
    if (!media.filename) {
        // Set the filename if needed
        media.filename = filename;
    }

    if (!media.extension) {
        // Try to figure out the file's proper extension
        if (ext && (media.type ? isValidExtensionForType(ext, media.type) : isValidExtension(ext))) {
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
    if (!media.type && media.extension) {
        // Ensure that we populate the media type
        media.type = getFileTypeByExt(media.extension);
    }
    return media;
}
