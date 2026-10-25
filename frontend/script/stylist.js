document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversationList");
  const conversationEmpty = document.getElementById("conversationEmpty");
  const conversationCount = document.getElementById("conversationCount");
  const newChatButton = document.getElementById("newChatButton");
  const activeTitle = document.getElementById("activeConversationTitle");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const messageList = document.getElementById("messageList");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const chatScrollArea = document.getElementById("chatScrollArea");
  const sidebar = document.getElementById("stylistSidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const openSidebarButton = document.getElementById("openSidebar");
  const closeSidebarButton = document.getElementById("closeSidebar");

  if (!conversationList || !messageForm || !messageInput) return;

  const conversations = [
    {
      id: "college-style",
      title: "Easy looks for college",
      messages: [
        { role: "user", content: "I need an easy outfit for college that still feels put together." },
        {
          role: "assistant",
          content: "A relaxed, layered look is a great everyday starting point. Try a crisp white tee with straight-leg denim, then add a light overshirt for a little structure. Keep the shoes simple and comfortable.",
          outfit: {
            title: "The campus classic",
            description: "Easy layers with a clean, balanced silhouette.",
            items: ["White tee", "Straight-leg denim", "Olive overshirt", "Clean sneakers"],
          },
        },
      ],
    },
    {
      id: "weekend-brunch",
      title: "Weekend brunch outfit",
      messages: [
        { role: "user", content: "What could I wear to a relaxed weekend brunch?" },
        { role: "assistant", content: "Try a soft knit top with wide-leg trousers and a low-profile shoe. A warm neutral base feels effortless; add one small accessory in a contrasting texture to make it feel intentional." },
      ],
    },
    {
      id: "colors",
      title: "Colors that work with navy",
      messages: [
        { role: "user", content: "What colors pair well with navy?" },
        { role: "assistant", content: "Navy is wonderfully versatile. For a refined combination, pair it with cream or soft white. Camel adds warmth, while muted sage feels relaxed. If you want a brighter accent, try a small touch of rust or coral." },
      ],
    },
    {
      id: "rainy-day",
      title: "A polished rainy-day look",
      messages: [
        { role: "user", content: "How do I dress nicely for a rainy day?" },
        { role: "assistant", content: "Build around a light, water-resistant outer layer and shoes that can handle wet sidewalks. A tonal base underneath keeps the outfit polished; add a compact umbrella and keep delicate fabrics for another day." },
      ],
    },
  ];

  let activeConversationId = null;
  let isResponding = false;

  const mockReplies = [
    {
      match: /party|evening|night|date/i,
      response: "For an evening plan, start with one piece that feels a little special and keep the rest of the look easy. A sleek dark base with a warm-toned layer and one polished accessory creates a confident outfit without feeling overdone.",
      outfit: {
        title: "Easy evening polish",
        description: "A simple base, one rich accent, and a little shine.",
        items: ["Dark tailored trousers", "Soft blouse", "Warm-toned jacket", "Simple gold jewelry"],
      },
    },
    {
      match: /college|class|campus|school/i,
      response: "For a comfortable college outfit, try a breathable top with relaxed denim and a lightweight layer you can take off between classes. Keep the colors tonal, then let your shoes or bag add a little personality.",
      outfit: {
        title: "The everyday campus edit",
        description: "Comfortable layers that still look considered.",
        items: ["Cotton tee", "Relaxed denim", "Light overshirt", "Everyday sneakers"],
      },
    },
    {
      match: /color|match|pair|palette/i,
      response: "A lovely way to build a color combination is to choose one anchor shade, one soft neutral, and one small accent. Navy works beautifully with cream and camel; olive pairs naturally with ecru and a touch of rust.",
    },
    {
      match: /wardrobe|closet|outfit/i,
      response: "Think of your wardrobe as a set of building blocks: choose a favorite base piece, add one layer for shape, and finish with a shoe that suits the occasion. Since this is a demo, I can’t see your actual wardrobe yet—but this formula works with pieces you already love.",
      outfit: {
        title: "A wardrobe-building formula",
        description: "Use your own favorite pieces to make this combination yours.",
        items: ["Favorite base", "One versatile layer", "Comfortable shoe", "Personal accessory"],
      },
    },
  ];

  function renderConversations() {
    conversationList.replaceChildren();
    conversations.forEach((conversation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `conversation-item${conversation.id === activeConversationId ? " active" : ""}`;
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-current", conversation.id === activeConversationId ? "true" : "false");
      const icon = document.createElement("i");
      icon.className = "bi bi-chat-left-text";
      icon.setAttribute("aria-hidden", "true");
      const title = document.createElement("span");
      title.textContent = conversation.title;
      button.append(icon, title);
      button.addEventListener("click", () => selectConversation(conversation.id));
      conversationList.appendChild(button);
    });

    conversationEmpty.hidden = conversations.length > 0;
    conversationCount.textContent = String(conversations.length);
  }

  function appendMessage(message, { animate = true } = {}) {
    const row = document.createElement("article");
    row.className = `message-row ${message.role}`;
    if (!animate) row.style.animation = "none";

    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.innerHTML = message.role === "user"
      ? '<i class="bi bi-person-fill" aria-hidden="true"></i>'
      : '<i class="bi bi-stars" aria-hidden="true"></i>';

    const content = document.createElement("div");
    content.className = "message-content";
    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = message.role === "user" ? "You" : "Closetly Stylist · Demo";
    const text = document.createElement("div");
    text.textContent = message.content;
    content.append(meta, text);

    if (message.outfit) {
      const outfit = document.createElement("section");
      outfit.className = "outfit-card";
      const heading = document.createElement("h3");
      heading.textContent = message.outfit.title;
      const description = document.createElement("p");
      description.textContent = message.outfit.description;
      const tags = document.createElement("div");
      tags.className = "outfit-tags";
      message.outfit.items.forEach((item) => {
        const tag = document.createElement("span");
        tag.textContent = item;
        tags.appendChild(tag);
      });
      outfit.append(heading, description, tags);
      content.appendChild(outfit);
    }

    row.append(avatar, content);
    messageList.appendChild(row);
  }

  function showMessages(conversation) {
    welcomeScreen.hidden = true;
    messageList.hidden = false;
    messageList.replaceChildren();
    conversation.messages.forEach((message) => appendMessage(message, { animate: false }));
    scrollToLatest();
  }

  function showWelcome() {
    welcomeScreen.hidden = false;
    messageList.hidden = true;
    messageList.replaceChildren();
  }

  function selectConversation(id) {
    activeConversationId = id;
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) {
      activeTitle.textContent = "Your Personal AI Stylist";
      showWelcome();
    } else {
      activeTitle.textContent = conversation.title;
      showMessages(conversation);
    }
    renderConversations();
    closeSidebar();
  }

  function startNewChat() {
    const conversation = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "New conversation",
      messages: [],
      isNew: true,
    };
    conversations.unshift(conversation);
    activeConversationId = conversation.id;
    activeTitle.textContent = "New conversation";
    showWelcome();
    renderConversations();
    closeSidebar();
    messageInput.focus();
  }

  function scrollToLatest() {
    requestAnimationFrame(() => {
      chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
    });
  }

  function updateSendState() {
    sendButton.disabled = isResponding || !messageInput.value.trim();
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 140)}px`;
  }

  function mockResponseFor(message) {
    return mockReplies.find((reply) => reply.match.test(message)) || {
      response: "That sounds like a fun styling question. Start with the piece you feel best in, then balance its color, shape, and comfort with the occasion. Tell me a little more about what you have in mind and I can help you narrow it down.",
    };
  }

  function showTypingIndicator() {
    const row = document.createElement("div");
    row.className = "message-row assistant typing-row";
    row.setAttribute("aria-label", "Stylist is thinking");
    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i>';
    const dots = document.createElement("span");
    dots.className = "message-content typing-indicator";
    dots.innerHTML = "<span></span><span></span><span></span>";
    row.append(avatar, dots);
    messageList.appendChild(row);
    scrollToLatest();
    return row;
  }

  function sendMessage(message) {
    if (!message || isResponding) return;
    if (!activeConversationId) startNewChat();

    const conversation = conversations.find((item) => item.id === activeConversationId);
    if (!conversation) return;

    conversation.messages.push({ role: "user", content: message });
    if (conversation.isNew) {
      conversation.title = message.trim().slice(0, 34) || "New conversation";
      conversation.isNew = false;
      activeTitle.textContent = conversation.title;
    }
    welcomeScreen.hidden = true;
    messageList.hidden = false;
    appendMessage({ role: "user", content: message });
    renderConversations();
    isResponding = true;
    updateSendState();
    const typingRow = showTypingIndicator();
    const reply = mockResponseFor(message);

    window.setTimeout(() => {
      typingRow.remove();
      conversation.messages.push({ role: "assistant", ...reply });
      isResponding = false;
      updateSendState();
      if (activeConversationId === conversation.id) {
        appendMessage({ role: "assistant", ...reply });
        scrollToLatest();
        messageInput.focus();
      }
    }, 750);
  }

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("open");
    closeSidebarButton.focus();
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("open");
  }

  newChatButton.addEventListener("click", startNewChat);
  messageInput.addEventListener("input", updateSendState);
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      messageForm.requestSubmit();
    }
  });
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message || isResponding) return;
    messageInput.value = "";
    updateSendState();
    sendMessage(message);
  });

  document.querySelectorAll(".suggestion-card").forEach((card) => {
    card.addEventListener("click", () => {
      messageInput.value = card.dataset.prompt || "";
      updateSendState();
      messageInput.focus();
    });
  });

  openSidebarButton.addEventListener("click", openSidebar);
  closeSidebarButton.addEventListener("click", closeSidebar);
  sidebarBackdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  renderConversations();
  updateSendState();
});
