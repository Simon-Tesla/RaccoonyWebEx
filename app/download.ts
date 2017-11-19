import * as I from './definitions';
import * as logger from './logger';

const downloadRootFolder = 'raccoony';


export function downloadFile(media: I.Media): Promise<I.DownloadResponse> {
    let conflictAction = "prompt";
    if (window.location.protocol === 'moz-extension:') {
        // Prompt conflictAction not supported in Firefox:
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/FilenameConflictAction
        conflictAction = "overwrite";
    }

    let filePath = makeDownloadFilePath(media);

    return browser.downloads.download({
        url: media.url,
        filename: filePath,
        saveAs: false,
        conflictAction,
    })
        .then(() => {
            return {
                message: "Download finished"
            }
        })
        .catch((err) => {
            logger.error("Error occurred while downloading:", err);
            return {
                message: "Error downloading",
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

export function isDownloaded(media: I.Media) {
    // TODO
}

export function createMetadataFile(media: I.Media) {
    // TODO
}

function sanitizePath(pathPart: string) {
    // Replace any spaces with underscores
    pathPart = pathPart.replace(" ", "_");
    // Replace any consecutive dots (e.g. "..") with a single dot.
    pathPart = pathPart.replace(/\.+/g, ".");
    // Replace any significant OS characters with underscores.
    return pathPart.replace(/[*"\\\/:|?%<>]/g, "_");
}
