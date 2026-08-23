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

    /*
      Replace this section later with your API call.

      Example:

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      const data = await response.json();

      return data.reply;
    */

    const message = userMessage.toLowerCase();

    if (
      message.includes("outfit") ||
      message.includes("wear")
    ) {
      return "Tell me the occasion, weather, or style you're going for and I'll build an outfit from your wardrobe.";
    }

    if (
      message.includes("wardrobe") ||
      message.includes("closet")
    ) {
      return "I can help you combine pieces from your wardrobe. Try asking me for a casual, formal, summer, or winter outfit.";
    }

    if (
      message.includes("summer")
    ) {
      return "For summer, I can put together a lightweight outfit using your available shirts, trousers, and sneakers.";
    }

    if (
      message.includes("winter")
    ) {
      return "For winter, I can layer your jackets, sweaters, shirts, and trousers into a complete look.";
    }

    return "I can help with outfits, wardrobe combinations, styling advice, shopping suggestions, and finding the right look.";
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