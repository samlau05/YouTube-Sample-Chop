// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log("YouTube Sampler extension installed.");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(changeInfo && changeInfo.status == "complete") {
      console.log("Tab updated: " + tab.url)
      chrome.tabs.sendMessage(tabId, { message: "URL updated", tab })
  }
});
  