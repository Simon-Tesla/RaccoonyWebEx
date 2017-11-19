import { MessageAction } from './enums';
import * as I from './definitions';
import openInTabs from './openTabs';

console.log("[background] setting up listeners");

browser.runtime.onMessage.addListener((request: I.MessageRequest<any>, sender: chrome.runtime.MessageSender, sendResponse) => {
    console.log("[background] received request", request.action, request);
    switch (request.action) {
        case MessageAction.Test:
            browser.tabs.create({
                url: 'http://raccoony.thornvalley.com'
            }).then((tab) => {
                console.log("[background.test] tab created", tab);
            });
            break;
        case MessageAction.OpenTabs:
            openInTabs(request.data);
            break;
    }
    return Promise.resolve();
});
