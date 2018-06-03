import { MessageAction, MediaType } from "./enums";
import { Media } from "./definitions";
import { downloadFile } from "./download";
import { getFilenameParts, getExtensionFromMimeType, isValidExtension } from "./utils/file";
import * as logger from './logger';

export function initializeContextMenu() {
    browser.contextMenus.onClicked.addListener((info, tab) => {
        logger.log('downloading file from context menu', info)
        // TODO: get downloadPath and such from settings
        const downloadPath = "raccoony-test/{siteName}/{siteFilenameExt}";

        // TODO: add a plugin hook for querying the host page for more data about the media in question
        const pageUrl = new URL(info.pageUrl);
        const itemUrl = new URL(info.srcUrl);
        const itemFile = itemUrl.pathname.split('/').pop();
        const mediaType: MediaType = info.mediaType as MediaType;

        const media: Media = {
            url: info.srcUrl,
            sourceUrl: info.pageUrl,
            siteName: pageUrl.hostname,
            filename: itemFile,
            siteFilename: itemFile,
            type: mediaType
        }

        const finallyDownload = () => downloadFile(media, { downloadPath });

        if (!media.extension) {
            // Try to figure out the file's proper extension
            const { filename, ext } = getFilenameParts(itemFile);
            if (isValidExtension(ext, mediaType)) {
                // Try to use the extension in the filename if it is present.
                media.filename = filename
                media.extension = ext;
                return finallyDownload();
            }
            else {
                // Failing that, try to get the mime-type of the file by looking at the request headers
                return fetch(info.srcUrl)
                    .then((response) => {
                        const mimeType = response.headers.get('Content-Type');
                        logger.log('fetching file to determine extension', mimeType, response);
                        if (response.ok) {
                            media.extension = getExtensionFromMimeType(mimeType);
                        }
                        return finallyDownload();
                    })
                    .catch(finallyDownload);
            }
        }
        else {
            return finallyDownload();
        }
    });

    browser.contextMenus.create({
        id: MessageAction.Download,
        title: "Download with Raccoony",
        contexts: ['image', 'video', 'audio']
    });
}

//TODO: move to utilities directory
