(function () {
  console.log("%cContent script loaded", "color: green; font-weight: bold");

  const platform = window.location.hostname.includes("twitch.tv") ? "twitch" : "kick";
  console.log("Detected platform:", platform);

  const sendMessage = (userName, messageText, platform) => {
    if (userName && messageText && platform) {
      const message = { userName, message: messageText, platform };
      console.log("Preparing to send message:", message);
      chrome.runtime.sendMessage(message, (response) => {
        console.log("Response from background script:", response);
      });
    } else {
      console.warn("Invalid message data:", { userName, messageText, platform });
    }
  };

  const observeChat = (chatContainer, platform) => {
    if (chatContainer) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const addedIndex = Array.from(node.parentNode.children).indexOf(node) + 1;

                let userElement, messageElement;

                if (platform === "kick") {
                  userElement = node.querySelector(".chat-entry-username");
                  messageElement = node.querySelector("span:nth-child(3) > span");
                } else if (platform === "twitch") {
                  userElement = node.querySelector(".chat-line__username > span > span");
                  messageElement = node.querySelector("span:nth-child(3) > span");
                }

                if (userElement && messageElement) {
                  const userName = userElement.textContent;
                  const messageText = messageElement.textContent;
                  console.log(`Captured: User: ${userName}, Message: ${messageText}`);
                  sendMessage(userName, messageText, platform);
                } else {
                  console.warn(`User or message element not found for index ${addedIndex}`, { userElement, messageElement });
                }
              }
            });
          }
        });
      });

      observer.observe(chatContainer, { childList: true });
      console.log("Observer set on chat container:", chatContainer);
      return true; // Successfully set observer
    } else {
      console.warn("Chat container not found for", platform);
      return false; // Failed to set observer
    }
  };

  const initObserver = () => {
    let chatContainer;

    if (platform === "kick") {
      chatContainer = document.querySelector("#chatroom > div.relative.flex.grow.flex-col.overflow-hidden > div.overflow-x-hidden.overflow-y-scroll.py-3");
    } else if (platform === "twitch") {
      chatContainer = document.querySelector(
        "#root > div > div.Layout-sc-1xcs6mc-0.gyHpt > div > div > section > div > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.chat-list--default.font-scale--default.iClcoJ > div.Layout-sc-1xcs6mc-0.InjectLayout-sc-1i43xsx-0.iWWhvN > div.scrollable-area > div.simplebar-scroll-content > div > div"
      );
    }

    if (chatContainer) {
      return observeChat(chatContainer, platform);
    } else {
      console.warn("Chat container element not found. Will retry.");
      return false;
    }
  };

  let retryCount = 0;
  const maxRetries = 5;
  const retryInterval = 2000; // 2 seconds
  let observerInitialized = false;

  const startObserverInit = () => {
    observerInitialized = initObserver();
    if (!observerInitialized && retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying to set observer, attempt ${retryCount}`);
      setTimeout(startObserverInit, retryInterval);
    } else if (observerInitialized) {
      console.log("Observer successfully initialized. Stopping retry attempts.");
    } else {
      console.log("Max retries reached. Stopping retry attempts.");
    }
  };

  setTimeout(startObserverInit, retryInterval);
})();
