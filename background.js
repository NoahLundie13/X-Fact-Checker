chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    (tab.url.includes('twitter.com') || tab.url.includes('x.com'))
  ) {
    chrome.tabs.sendMessage(tabId, {
      action: "addButtons"
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (
    tab.url &&
    (tab.url.includes('twitter.com') || tab.url.includes('x.com'))
  ) {
    chrome.tabs.sendMessage(tab.id, {
      action: "addButtons"
    }, (response) => {
      if (response && response.count) {
        console.log(`Added fact check buttons to ${response.count} tweets.`);
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "displayFactCheck") {
    console.log("Fact check received:", message.text);
  }
  return true;
});
