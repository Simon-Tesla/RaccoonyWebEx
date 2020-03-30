import * as I from './definitions';
import * as logger from './logger';
import IntlMessageFormat from 'intl-messageformat';
import { DownloadDestination } from './enums';
import { DateTime } from 'luxon';

const downloadRootFolder = 'raccoony';
const isFirefox = window.location.protocol === 'moz-extension:';

const defaultPath = "raccoony/{siteName}/{author}/{submissionId}_{filename}_by_{author}.{extension}";
const defaultContextPath = "raccoony/{siteName}/{author}/{filenameExt}";

export function downloadFile(media: I.Media, settings: I.SiteSettings): Promise<I.DownloadResponse> {
    // Prompt conflictAction not supported in Firefox:
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/FilenameConflictAction
    let conflictAction = "overwrite";
    let filePath = makeDownloadFilePath(media, settings);

    let promises: Promise<any>[] = [];
    if (settings.writeMetadata) {
        promises.push(createMetadataFile(media, filePath));
    }

    promises.push(browser.downloads.download({
        url: media.url,
        filename: filePath,
        saveAs: false,
        conflictAction,
    }));

    return Promise.all(promises)
        .then(() => {
            return { success: true };
        })
        .catch((err) => {
            logger.error("Error occurred while downloading:", err);
            return { success: false };
        });
}

function makeDownloadFilePath(media: I.Media, settings: I.SiteSettings) {
    let path: string[]
    let downloadPath = media.downloadDestination === DownloadDestination.ContextMenuDefault
        ? settings.contextDownloadPath || defaultContextPath
        : settings.downloadPath || defaultPath;
    path = replacePathPlaceholders(downloadPath, media)
        .split('/')
        .filter(pathPart => !!(pathPart.trim()));

    let pathStr = path.map(sanitizePath).join('/');
    logger.log("generated path:", pathStr)
    return pathStr;
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

export function createMetadataFile(media: I.Media, mediaFilePath: string) {
    let metadata = `Title:\t${media.title}
Author:\t${media.author}
Tags:\t${(media.tags || []).join(', ')}
Source URL:\t${media.sourceUrl}
Description:
${media.description}
JSON:
${JSON.stringify(media, null, '  ')}
`;
    let filePath = mediaFilePath + '.txt';
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
    // Replace any trailing dots
    pathPart = pathPart.replace(/\.$/g, '_');
    // Replace any significant OS characters with underscores.
    return pathPart.replace(/[*"\\\/:|?%<>]/g, "_");
}

let cachedMsg: IntlMessageFormat = null;
let cachedPath: string = null;

function replacePathPlaceholders(path: string, media: I.Media) {
    // Replace any backslashes with forward slashes, since that's likely the intent on Windows
    // and anyone who uses backslashes as significant characters in filenames deserves what they get.
    path = path.replace(/\\/g, '/');

    if (!cachedMsg || cachedPath !== path) {
        cachedMsg = new IntlMessageFormat(path, 'en-US');
        cachedPath = path;
    }

    let url = new URL(media.url);

    const siteFilenameExt = (!media.extension || media.siteFilename.endsWith(media.extension))
        ? media.siteFilename
        : `${media.siteFilename}.${media.extension}`

    const currentDate = new Date();
    const isoDate = DateTime.fromJSDate(currentDate).toFormat("yyyy-MM-dd");
    const isoTime = DateTime.fromJSDate(currentDate).toFormat("HH_mm_ss");
        
    const vars = {
        siteName: media.siteName,
        submissionId: media.submissionId,
        author: media.author,
        filename: media.filename,
        filenameExt: media.extension ? `${media.filename}.${media.extension}` : media.filename,
        siteFilenameExt: siteFilenameExt,
        siteFilename: media.siteFilename,
        extension: media.extension,
        type: media.type,
        title: media.title,
        domain: url.hostname,
        currentDate: currentDate,
        isoDate,
        isoTime
    };

    Object.getOwnPropertyNames(vars).forEach(k => {
        // Sanitize any significant path characters from the variables to substitute.
        vars[k] = vars[k] && sanitizePath(`${vars[k]}`);
    });

    return cachedMsg.format(vars);
}