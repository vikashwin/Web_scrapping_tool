// Initialize side panel behavior on installation
chrome.runtime.onInstalled.addListener(() => {
    // Enable opening panel by clicking the toolbar icon
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => console.log("Side panel behavior set"))
      .catch(err => console.error("Error setting panel behavior:", err));
      
    // Set default options
    chrome.sidePanel.setOptions({
      enabled: true,
      path: "sidebar.html"
    });
  });
  
  // Optional: Programmatic opening example
  chrome.action.onClicked.addListener(() => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
      .catch(err => console.error("Error opening side panel:", err));
  });