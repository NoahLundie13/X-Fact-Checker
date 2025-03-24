chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url && (tab.url.includes("twitter.com") || tab.url.includes("x.com"))) {
      chrome.tabs.sendMessage(tabId, { action: "addButtons" });
    }
  }
});
