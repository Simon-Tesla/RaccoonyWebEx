import { MessageAction, MediaType } from "./enums";
import { Media, MessageRequest, ContextDownloadData, ContextDownloadRequest } from "./definitions";
import { downloadFile } from "./download";
import { getFilenameParts, getExtensionFromMimeType } from "./utils/file";
import * as logger from './logger';
import { CachedSettings } from "./settings";

enum ContextMenuItems {
    download = "download",
}

const contextMenuApi: typeof browser.menus = browser["contextMenus"] || browser.menus;

let contextMenuId: number | string = null;
export async function initializeContextMenu(settingsProvider: CachedSettings) {
    await settingsProvider.ready;
    const extensionSettings = settingsProvider.getExtensionSettings();

    contextMenuApi.onClicked.addListener(contextMenuListener);

    if (extensionSettings.showContextMenu) {
        createMenu();
    }

    settingsProvider.addListener(settingsProvider => {
        // Respond to changes in the settings to hide and show the menu
        const hasMenu = !!contextMenuId;
        const showContextMenu = settingsProvider.getExtensionSettings().showContextMenu;
        if (hasMenu !== showContextMenu) {
            if (showContextMenu) {
                createMenu();
            }
            else {
                removeMenu();
            }
        }
    });

    function contextMenuListener(info: browser.menus.OnClickData, tab: browser.tabs.Tab) {
        logger.log("handling context menu", info.menuItemId);
        if (info.menuItemId === ContextMenuItems.download) {
            return initiateContextDownload(tab, info.srcUrl, info.mediaType as MediaType)
        }
    }

    async function initiateContextDownload(tab: browser.tabs.Tab, srcUrl: string, mediaType: MediaType) {
        await loadContentScripts(tab);
        // Ask the page about its media
        const message: ContextDownloadRequest = {
            action: MessageAction.PageContextDownload,
            data: {
                srcUrl,
                mediaType
            },
        };
        return browser.tabs.sendMessage(tab.id, message);
    }

    function createMenu() {
        contextMenuId = contextMenuApi.create({
            id: ContextMenuItems.download,
            title: "Download with Raccoony",
            contexts: ['image', 'video', 'audio']
        });
    }

    function removeMenu() {
        contextMenuApi.removeAll();
        contextMenuId = null;
    }
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
