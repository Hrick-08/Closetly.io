/* =====================================================
   CLOSETLY AI ASSISTANT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const aiToggle = document.getElementById("aiAssistantToggle");
  const aiChatbox = document.getElementById("aiChatbox");
  const aiClose = document.getElementById("aiChatClose");
  const aiForm = document.getElementById("aiChatForm");
  const aiInput = document.getElementById("aiChatInput");
  const aiMessages = document.getElementById("aiChatMessages");
  const suggestions = document.querySelectorAll(".ai-suggestion");

  if (!aiToggle || !aiChatbox) return;

  // Base URL of the FastAPI microservice. Change this if you deploy it
  // somewhere other than localhost.
  const MICROSERVICE_URL = "https://closetly-io.onrender.com";

  // Key used to persist the conversation across page navigations.
  // sessionStorage survives moving between pages in the same tab,
  // and clears automatically when the tab/browser closes.
  const STORAGE_KEY = "closetlyChatHistory";

  // Running conversation history sent to /chat for multi-turn context.
  // Restored from sessionStorage on load so it survives page changes.
  let chatHistory = loadChatHistory();


  /* -----------------------------------------
     PERSISTENCE
  ----------------------------------------- */

  function loadChatHistory() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }
  }

  function saveChatHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }

  function restoreChatUI() {
    chatHistory.forEach(turn => {
      addMessage(turn.content, turn.role === "user" ? "user" : "bot");
    });
  }

  function clearChatHistory() {
    chatHistory = [];
    sessionStorage.removeItem(STORAGE_KEY);
    aiMessages.innerHTML = "";
  }

  // Exposed so you can wire a "New chat" / clear button to this later,
  // e.g. <button onclick="window.closetlyClearChat()">.
  window.closetlyClearChat = clearChatHistory;


  /* -----------------------------------------
     OPEN / CLOSE CHAT
  ----------------------------------------- */

  function openAIChat() {
    aiChatbox.classList.add("open");
    aiToggle.classList.add("active");

    setTimeout(() => {
      aiInput?.focus();
    }, 200);
  }

  function closeAIChat() {
    aiChatbox.classList.remove("open");
    aiToggle.classList.remove("active");
  }

  aiToggle.addEventListener("click", () => {
    if (aiChatbox.classList.contains("open")) {
      closeAIChat();
    } else {
      openAIChat();
    }
  });

  aiClose.addEventListener("click", closeAIChat);

  // Repaint any messages from a previous page into the chat window.
  restoreChatUI();


  /* -----------------------------------------
     ADD MESSAGE
  ----------------------------------------- */

  function addMessage(message, sender = "bot") {

    const messageWrapper = document.createElement("div");

    messageWrapper.className =
      sender === "user"
        ? "ai-message ai-message-user"
        : "ai-message ai-message-bot";

    const avatar = document.createElement("div");
    avatar.className = "ai-message-avatar";

    avatar.innerHTML =
      sender === "user"
        ? '<i class="bi bi-person-fill"></i>'
        : '<i class="bi bi-stars"></i>';

    const content = document.createElement("div");
    content.className = "ai-message-content";
    content.textContent = message;

    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(content);

    aiMessages.appendChild(messageWrapper);

    aiMessages.scrollTop = aiMessages.scrollHeight;
  }


  /* -----------------------------------------
     TYPING INDICATOR
  ----------------------------------------- */

  function showTyping() {

    const typing = document.createElement("div");

    typing.className = "ai-message ai-message-bot";
    typing.id = "aiTypingIndicator";

    typing.innerHTML = `
      <div class="ai-message-avatar">
        <i class="bi bi-stars"></i>
      </div>

      <div class="ai-message-content">
        <div class="ai-typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    aiMessages.appendChild(typing);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }


  function removeTyping() {
    const typing = document.getElementById("aiTypingIndicator");

    if (typing) {
      typing.remove();
    }
  }


  /* -----------------------------------------
     AI RESPONSE
  ----------------------------------------- */

  async function generateAIResponse(userMessage) {

    const response = await fetch(`${MICROSERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,
        history: chatHistory
      })
    });

    if (!response.ok) {
      throw new Error(`Assistant request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Keep the running conversation in sync for the next turn's context.
    chatHistory.push({ role: "user", content: userMessage });
    chatHistory.push({ role: "assistant", content: data.response });
    saveChatHistory();

    return data.response;
  }


  /* -----------------------------------------
     SEND MESSAGE
  ----------------------------------------- */

  async function sendMessage(message) {

    message = message.trim();

    if (!message) return;

    addMessage(message, "user");

    aiInput.value = "";
    aiInput.disabled = true;

    showTyping();

    try {

      const response = await generateAIResponse(message);

      await new Promise(resolve => setTimeout(resolve, 700));

      removeTyping();

      addMessage(response, "bot");

    } catch (error) {

      removeTyping();

      addMessage(
        "Something went wrong. Please try again.",
        "bot"
      );

      console.error("AI Assistant Error:", error);

    } finally {

      aiInput.disabled = false;
      aiInput.focus();

    }
  }


  /* -----------------------------------------
     FORM SUBMIT
  ----------------------------------------- */

  aiForm.addEventListener("submit", (event) => {

    event.preventDefault();

    sendMessage(aiInput.value);

  });


  /* -----------------------------------------
     QUICK SUGGESTIONS
  ----------------------------------------- */

  suggestions.forEach(button => {

    button.addEventListener("click", () => {

      const message = button.textContent.trim();

      sendMessage(message);

    });

  });

});