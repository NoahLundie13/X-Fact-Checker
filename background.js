chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
    chrome.tabs.sendMessage(tabId, {
      action: "addButtons"
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
    chrome.tabs.sendMessage(tab.id, {
      action: "addButtons"
    }, (response) => {
      if (response && response.count) {
        console.log(`Added fact check buttons to ${response.count} tweets.`);
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "displayFactCheck") {
    // This function is not needed anymore as we're displaying fact checks 
    // directly in the tweet, but keeping it for potential future use
    console.log("Fact check received:", message.text);
  }
  return true;
});