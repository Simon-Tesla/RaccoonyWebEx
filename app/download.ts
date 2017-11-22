import * as I from './definitions';
import * as logger from './logger';

const downloadRootFolder = 'raccoony';
const isFirefox = window.location.protocol === 'moz-extension:';

export function downloadFile(media: I.Media): Promise<I.DownloadResponse> {
    // Prompt conflictAction not supported in Firefox:
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/FilenameConflictAction
    let conflictAction = isFirefox ? "overwrite" : "prompt";
    let filePath = makeDownloadFilePath(media);

    return browser.downloads.download({
        url: media.url,
        filename: filePath,
        saveAs: false,
        conflictAction,
    })
        .then(() => {
            return {
                message: "",
                isError: false,
            }
        })
        .catch((err) => {
            logger.error("Error occurred while downloading:", err);
            return {
                message: "",
                isError: true,
            }
        });
}

function makeDownloadFilePath(media: I.Media) {
    // TODO: make this configurable

    let path: string[] = [
        downloadRootFolder,
        media.service,
        media.author,
        `${media.submissionId}_${media.filename}_by_${media.author}.${media.extension}`
    ];

    return path.map(sanitizePath).join('/');
}

function getDownloadedFile(media: I.Media): Promise<browser.downloads.DownloadItem> {
    return browser.downloads.search({ url: media.url })
        .then((downloads) => {
            return (downloads || []).find(item => item.exists);
        })
        .catch((err) => {
            logger.error("Error while searching downloads", err);
            return null;
        });
}

export function isDownloaded(media: I.Media): Promise<boolean> {
    return getDownloadedFile(media).then(item => {
        logger.log('got download item', item);
        return item && item.exists
    });
}

export function showFile(media: I.Media): Promise<void> {
    return getDownloadedFile(media).then(download => {
        logger.log('attempting to show item', download);
        if (download) {
            // TODO: polyfill doesn't work in Chrome; API doesn't support promises
            //return browser.downloads.show(download.id);
            return new Promise<void>((resolve, reject) => {
                chrome.downloads.show(download.id)
                resolve();
            });
        }
        return Promise.reject(new Error('Download not found'));
    });
}

export function openFile(media: I.Media) {
    return getDownloadedFile(media).then(download => {
        return browser.downloads.open(download.id);
    });
}

export function createMetadataFile(media: I.Media) {
    // TODO: integrate
    let metadata = `Title:\t${media.title}
Author:\t${media.author}
Tags:\t${(media.tags || []).join(', ')}
Source URL:\t${media.sourceUrl}
Description:
${media.description}
JSON:
${JSON.stringify(media, null, '  ')}
`;
    let filePath = makeDownloadFilePath(media) + '.txt';
    let file = new Blob([metadata], { type: 'text/plain', endings: 'native' });
    let url = URL.createObjectURL(file);
    return browser.downloads.download({
        url: url,
        filename: filePath,
        saveAs: false,
        conflictAction: 'overwrite',
    })
}

function sanitizePath(pathPart: string) {
    // Replace any spaces with underscores
    pathPart = pathPart.replace(" ", "_");
    // Replace any consecutive dots (e.g. "..") with a single dot.
    pathPart = pathPart.replace(/\.+/g, ".");
    // Replace any significant OS characters with underscores.
    return pathPart.replace(/[*"\\\/:|?%<>]/g, "_");
}
