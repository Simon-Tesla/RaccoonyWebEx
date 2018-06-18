import { MessageAction, MediaType } from "./enums";
import { Media, MessageRequest, ContextDownloadData, ContextDownloadRequest } from "./definitions";
import { downloadFile } from "./download";
import { getFilenameParts, getExtensionFromMimeType, isValidExtension } from "./utils/file";
import * as logger from './logger';
import { CachedSettings } from "./settings";

enum ContextMenuItems {
    download = "download",
}

async function loadContentScripts(tab: browser.tabs.Tab): Promise<void> {
    // Check to see if we've already injected the content scripts before injecting them.
    const message: MessageRequest<void> = {
        action: MessageAction.PageContentScriptPresent
    }
    let loaded = false;
    try {
        let response = await browser.tabs.sendMessage(tab.id, message) as { loaded: boolean };
        loaded = response && response.loaded;
    } catch (e) { /*swallow errors*/ }

    if (!loaded) {
        await browser.tabs.executeScript(tab.id, { file: '/browser-polyfill.js' });
        await browser.tabs.executeScript(tab.id, { file: '/contextMenuInject.js' });
    }
}

export function initializeContextMenu(settingsProvider: CachedSettings) {
    browser.contextMenus.onClicked.addListener(contextMenuListener);

    browser.contextMenus.create({
        id: ContextMenuItems.download,
        title: "Download with Raccoony",
        contexts: ['image', 'video', 'audio']
    });

    function contextMenuListener(info: browser.contextMenus.OnClickData, tab: browser.tabs.Tab) {
        logger.log("handling context menu", info.menuItemId);
        if (info.menuItemId === ContextMenuItems.download) {
            return initiateContextDownload(tab, info.srcUrl, info.mediaType as MediaType)
        }
    }

    function initiateContextDownload(tab: browser.tabs.Tab, srcUrl: string, mediaType: MediaType) {
        return loadContentScripts(tab)
            .then(() => {
                // Ask the page about its media
                const message: ContextDownloadRequest = {
                    action: MessageAction.PageContextDownload,
                    data: {
                        srcUrl,
                        mediaType
                    },
                };
                return browser.tabs.sendMessage(tab.id, message);
            });
    }
}

