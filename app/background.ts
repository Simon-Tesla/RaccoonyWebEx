import { MessageAction } from './enums';
import * as I from './definitions';
import openInTabs from './openTabs';
import * as download from './download';
import * as logger from './logger';
import { CachedSettings } from './settings'
import { initializeContextMenu } from './contextMenu';

logger.log("[background] setting up listeners");

var settingsProvider = new CachedSettings();

browser.runtime.onMessage.addListener((request: I.MessageRequest<any>, sender: chrome.runtime.MessageSender, sendResponse) => {
    logger.log("[background] received request", request.action, request);
    return settingsProvider.ready
        .then(() => {
            switch (request.action) {
                case MessageAction.OpenTabs:
                    const list: I.PageLinkList = request.data;
                    return openInTabs(list, settingsProvider.getCurrentSettings(list.siteName));
                case MessageAction.Download:
                    const media: I.Media = request.data;
                    return download.downloadFile(media, settingsProvider.getCurrentSettings(media.siteName));
                case MessageAction.OpenFile:
                    return download.openFile(request.data);
                case MessageAction.ShowFile:
                    return download.showFile(request.data);
                case MessageAction.CheckDownlod:
                    return download.isDownloaded(request.data);
                case MessageAction.ShowGlobalOptions:
                    return browser.runtime.openOptionsPage();
            }
            logger.error('Invalid message received')
            return Promise.reject<any>(new Error('Invalid message'));
        })
});

initializeContextMenu();