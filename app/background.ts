import { MessageAction } from './enums';
import * as I from './definitions';

console.log("[background] setting up listeners");

browser.runtime.onMessage.addListener((request: I.MessageRequest, sender: chrome.runtime.MessageSender, sendResponse) => {
    console.log("[background] received request", request.action, request);
    if (request.action === MessageAction.Test) {
        browser.tabs.create({
            url: 'http://raccoony.thornvalley.com'
        }).then((tab) => {
            console.log("[background.test] tab created", tab);
        });
    }
    return Promise.resolve();
});