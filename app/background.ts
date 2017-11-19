import { MessageAction } from './enums';
import * as I from './definitions';
import openInTabs from './openTabs';
import { downloadFile } from './download';
import * as logger from './logger';

logger.log("[background] setting up listeners");

browser.runtime.onMessage.addListener((request: I.MessageRequest<any>, sender: chrome.runtime.MessageSender, sendResponse) => {
    logger.log("[background] received request", request.action, request);
    switch (request.action) {
        case MessageAction.Test:
            browser.tabs.create({
                url: 'http://raccoony.thornvalley.com'
            }).then((tab) => {
                logger.log("[background.test] tab created", tab);
            });
            break;
        case MessageAction.OpenTabs:
            openInTabs(request.data);
            break;
        case MessageAction.Download:
            downloadFile(request.data);
            break;
    }
    return Promise.resolve();
});
