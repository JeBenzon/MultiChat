document.addEventListener("DOMContentLoaded", function () {
  const chatContainer = document.getElementById("chat-container");
  console.log("allMessages page initialized");

  // Function to scroll chat container to bottom
  const scrollToBottom = () => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    const sound = new Audio(chrome.runtime.getURL("sounds/notification.mp3"));
    sound.play();
  };

  // Function to hash username into a hex color
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

    // Ensure the color is not too light (i.e., not white or near-white)
    const rgb = parseInt(color.slice(1), 16);
    if ((rgb & 0xffffff) > 0xaaaaaa) {
      color = `#${((rgb / 2) & 0xffffff).toString(16).padStart(6, "0")}`; // Darken the color
    }

    return color;
  };

  // Function to add message to the container
  const addMessageToContainer = ({ userName, message, platform }) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", platform);

    const headerElement = document.createElement("div");
    headerElement.classList.add("chat-header");

    const iconElement = document.createElement("img");
    iconElement.classList.add("chat-icon");
    iconElement.src = `icons/${platform}-icon.png`;

    const usernameElement = document.createElement("span");
    usernameElement.classList.add("chat-username");
    usernameElement.style.color = hashUsernameToColor(userName); // Apply unique color
    usernameElement.textContent = userName;

    headerElement.appendChild(iconElement);
    headerElement.appendChild(usernameElement);

    const messageText = document.createElement("span");
    messageText.classList.add("chat-message-text");
    messageText.textContent = message;

    messageElement.appendChild(headerElement);
    messageElement.appendChild(messageText);
    chatContainer.appendChild(messageElement);

    console.log(`Message displayed in allMessages.js: [${platform}] ${userName}: ${message}`);

    scrollToBottom(); // Scroll to bottom after adding new message
    playNotificationSound(); // Play sound after adding new message
  };

  // Request all messages when the page loads
  chrome.runtime.sendMessage({ action: "getMessages" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    if (response && response.status === "success" && Array.isArray(response.messages)) {
      response.messages.forEach((msg) => addMessageToContainer(msg));
    } else {
      console.warn("No messages found or invalid response", response);
    }
  });

  // Listen for new messages
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "newMessage") {
      console.log("New message received in allMessages.js:", request);
      addMessageToContainer(request);
    }
  });
});
