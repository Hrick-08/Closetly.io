/* =====================================================
   CLOSETLY AI ASSISTANT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("aiAssistantMount");
  if (!mount) return;

  const IN_PAGES_DIR = window.location.pathname.toLowerCase().includes("/pages/");
  const rootPath = IN_PAGES_DIR ? "../" : "";

  fetch(rootPath + "components/assistant.html")
    .then((res) => {
      if (!res.ok) throw new Error("Assistant could not be loaded");
      return res.text();
    })
    .then((html) => {
      mount.innerHTML = html;
      initAssistant();
    })
    .catch((error) => {
      console.error("AI Assistant could not be loaded:", error);
    });
});

function initAssistant() {

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
  const WELCOME_MESSAGE = "Hey! I'm your Closetly AI stylist. What are you looking for today?";
  let chatHistory = [];


  /* -----------------------------------------
     CHAT RESET
  ----------------------------------------- */

  function clearChatHistory() {
    chatHistory = [];
    aiMessages.innerHTML = "";
    addMessage(WELCOME_MESSAGE);

    try {
      sessionStorage.removeItem("closetlyChatHistory");
    } catch (error) {
      console.error("Failed to clear saved chat history:", error);
    }
  }

  // Exposed so you can wire a "New chat" / clear button to this later,
  // e.g. <button onclick="window.closetlyClearChat()">.
  window.closetlyClearChat = clearChatHistory;
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) clearChatHistory();
  });


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

  clearChatHistory();


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

  function addAssistantResponse(data) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "ai-message ai-message-bot";

    const avatar = document.createElement("div");
    avatar.className = "ai-message-avatar";
    avatar.innerHTML = '<i class="bi bi-stars"></i>';

    const content = document.createElement("div");
    content.className = "ai-message-content ai-assistant-response";
    const response = document.createElement("p");
    response.className = "ai-response-text";
    response.textContent = data.response || "";
    content.appendChild(response);

    (data.outfits || []).forEach((outfit) => {
      const card = document.createElement("article");
      card.className = "ai-outfit-card";

      const title = document.createElement("h4");
      title.textContent = outfit.name;
      card.appendChild(title);

      const items = document.createElement("div");
      items.className = "ai-outfit-items";
      (outfit.items || []).forEach((item) => {
        const itemEl = document.createElement("div");
        itemEl.className = "ai-outfit-item";

        const image = document.createElement("img");
        image.src = item.imageUrl || placeholderImage();
        image.alt = item.name || "Wardrobe item";
        image.onerror = () => {
          image.src = placeholderImage();
        };

        const name = document.createElement("h5");
        name.textContent = item.name;
        const category = document.createElement("span");
        category.textContent = item.category;

        itemEl.append(image, name, category);
        items.appendChild(itemEl);
      });
      card.appendChild(items);

      if (outfit.reason) {
        const reason = document.createElement("p");
        reason.className = "ai-outfit-reason";
        reason.textContent = outfit.reason;
        card.appendChild(reason);
      }

      if (outfit.stylingTips?.length) {
        const tipsTitle = document.createElement("strong");
        tipsTitle.className = "ai-outfit-tips-title";
        tipsTitle.textContent = "Stylist tip";
        card.appendChild(tipsTitle);

        const tips = document.createElement("ul");
        tips.className = "ai-outfit-tips";
        outfit.stylingTips.forEach((tip) => {
          const tipEl = document.createElement("li");
          tipEl.textContent = tip;
          tips.appendChild(tipEl);
        });
        card.appendChild(tips);
      }

      const actions = document.createElement("div");
      actions.className = "ai-outfit-actions";
      ["View outfit", "Try another"].forEach((label) => {
        const action = document.createElement("button");
        action.type = "button";
        action.textContent = label;
        action.addEventListener("click", () => {
          if (label === "Try another") {
            aiInput.value = "Show me another outfit from my wardrobe.";
            aiForm.requestSubmit();
          }
        });
        actions.appendChild(action);
      });
      card.appendChild(actions);
      content.appendChild(card);
    });

    messageWrapper.append(avatar, content);
    aiMessages.appendChild(messageWrapper);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  function placeholderImage() {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="100%" height="100%" fill="#f0ece5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9a6037" font-family="sans-serif" font-size="14">No image</text></svg>'
    );
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

    const data = await Api.microservice.chat(userMessage, chatHistory.slice(-20));

    // Keep the running conversation in sync for the next turn's context.
    chatHistory.push({ role: "user", content: userMessage });
    chatHistory.push({ role: "assistant", content: data.response });

    return data;
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

      addAssistantResponse(response);

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

}