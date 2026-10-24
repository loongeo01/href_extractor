function onError(error) {
    console.log(error)
}

function sendMessageToTabs(querying, message) {

    querying.then((tabs) => {
        for (const tab of tabs) {
            browser.tabs
                .sendMessage(tab.id, { msg: message })
                .catch(onError);
        }
    }, () => { })


}

let popupOpened = false
browser.action.onClicked.addListener(async (tab) => {
    let querying = browser.tabs.query({
        currentWindow: true,
        active: true,
    })

    if (popupOpened == false) {
        popupOpened = true

        if (!tab.id) return;

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["dist/content_main.js"]
        }).then(() => { })
            .catch(() => { });

        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ["public/output2.css"]
        })
            .then(() => { })
            .catch(() => { });

        sendMessageToTabs(querying, "Open Popup")

    }
    else {
        if (hiddenWindowId != null) {
            chrome.windows.remove(
                hiddenWindowId,
            )
        }
        popupOpened = false

        chrome.scripting.removeCSS({
            target: { tabId: tab.id },
            files: ["public/output2.css"]
        })
            .then(() => { })
            .catch(() => { });
        sendMessageToTabs(querying, "Close Popup")
    }
}

)

let hiddenWindowId = null
let currentBrowserID = null
browser.runtime.onMessage.addListener(async (request) => {
    if (request.msg[0] == "Minimize") {

        currentBrowserID = request.msg[1]
        let newWindow = await chrome.windows.create({
            url: `${chrome.runtime.getURL("popup.html")}`,
            type: "popup",
            width: 400,
            height: 600,
            left: 400,
            top: 150
        });

        hiddenWindowId = newWindow.id;
        chrome.windows.update(hiddenWindowId, {
            state: "minimized"
        })
            .then(() => { })
            .catch(() => { });

    }
})

browser.windows.onFocusChanged.addListener((windowId) => {

    if (hiddenWindowId != null && windowId == hiddenWindowId) {

        chrome.windows.remove(
            hiddenWindowId,
        ).then(() => { })
            .catch(() => { });

        hiddenWindowId = null

        let querying = browser.tabs.query({
            windowId: currentBrowserID
        })

        sendMessageToTabs(querying, "Unminimize")
    }
});

