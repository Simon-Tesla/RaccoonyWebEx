import { MessageAction } from './enums';
import * as I from './definitions';
import openInTabs from './openTabs';
import * as download from './download';
import * as logger from './logger';
import { CachedSettings } from './settings'
import { initializeContextMenu } from './contextMenu';

logger.log("[background] setting up listeners");

var settingsProvider = new CachedSettings();

type MessageRequestTypes = I.MediaMessageRequest | I.TabMessageRequest | I.OptionsMessageRequest | { action: 'never' }

browser.runtime.onMessage.addListener((req, sender, _sendResponse) => {
    const request: MessageRequestTypes = req;
    logger.log("[background] received request", request.action, request);
    return settingsProvider.ready!
        .then(() => {
            switch (request.action) {
                case MessageAction.OpenTabs:
                    const list = request.data;
                    let switchToNewTab = settingsProvider.getExtensionSettings().switchToNewTab;
                    if (list.overrideNewTabBehavior) {
                        switchToNewTab = !switchToNewTab;
                    }
                    return openInTabs(
                        list, 
                        settingsProvider.getCurrentSettings(list.siteName!),
                        { windowId: sender.tab.windowId, switchToNewTab: switchToNewTab }
                    );
                case MessageAction.Download:
                    const media = request.data;
                    return download.downloadFile(media, settingsProvider.getCurrentSettings(media.siteName));
                case MessageAction.OpenFile:
                    return download.openFile(request.data);
                case MessageAction.ShowFile:
                    return download.showFile(request.data);
                case MessageAction.CheckDownload:
                    return download.isDownloaded(request.data);
                case MessageAction.ShowGlobalOptions:
                    return browser.runtime.openOptionsPage();
            }
            logger.error('Invalid message received')
            return Promise.reject<any>(new Error('Invalid message'));
        })
});

initializeContextMenu(settingsProvider);