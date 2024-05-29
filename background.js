let messages = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background.js:", request);

  const { userName, message, platform, action } = request;
  console.log("[background.js] Extracted properties:", { userName, message, platform, action });

  if (userName && message) {
    messages.push({ userName, message, platform });
    console.log(`[background.js] Message received and saved: [${platform}] ${userName}: ${message}`);
    chrome.runtime.sendMessage({ action: "newMessage", userName, message, platform });

    // Notify to play sound
    chrome.runtime.sendMessage({ action: "playSound" });

    sendResponse({ status: "Message received and saved in background script" });
  } else if (action === "getMessages") {
    sendResponse({ status: "success", messages });
    console.log(`[background.js] Sent messages to popup:`, messages);
  } else {
    console.log("[background.js] Message received with missing data:", request);
    sendResponse({ status: "Message received with missing data" });
  }
});
