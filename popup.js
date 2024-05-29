document.addEventListener("DOMContentLoaded", function () {
  const chatContainer = document.getElementById("chat-container");
  const allMessagesBtn = document.getElementById("all-messages-btn");
  console.log("Popup initialized");

  const hashUsernameToColor = (username) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }

    const rgb = parseInt(color.slice(1), 16);
    if ((rgb & 0xffffff) > 0xaaaaaa) {
      color = `#${((rgb / 2) & 0xffffff).toString(16).padStart(6, "0")}`;
    }

    return color;
  };

  const addMessageToContainer = ({ userName, message, platform }) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", platform);
    messageElement.style.color = hashUsernameToColor(userName); // Apply unique color

    const iconElement = document.createElement("img");
    iconElement.src = `icons/${platform}-icon.png`;

    const messageText = document.createElement("span");
    messageText.textContent = `${userName}: ${message}`;

    messageElement.appendChild(iconElement);
    messageElement.appendChild(messageText);
    chatContainer.appendChild(messageElement);

    console.log(`Message displayed in popup.js: [${platform}] ${userName}: ${message}`);
  };

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "newMessage") {
      console.log("New message received in popup.js:", request);
      addMessageToContainer(request);
    }
  });

  chrome.runtime.sendMessage({ action: "getMessages" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    if (response && response.status === "success" && Array.isArray(response.messages)) {
      response.messages.forEach((msg) => {
        addMessageToContainer(msg);
        console.log("Loaded message from background.js:", msg);
      });
    } else {
      console.warn("No messages found or invalid response", response);
    }
  });

  allMessagesBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("allMessages.html") });
  });
});
