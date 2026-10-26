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
  const notice = document.getElementById("stylistNotice");
  const chatError = document.getElementById("chatError");

  if (!conversationList || !messageForm || !messageInput) return;

  const ACTIVE_CONVERSATION_KEY = "closetlyStylistActiveConversationId";
  const conversations = [];
  let activeConversationId = null;
  let activeConversation = null;
  let isResponding = false;
  let conversationLoadId = 0;
  let typingRow = null;
  let openConversationMenuId = null;
  let deletingConversationId = null;

  function setNotice(message, isError = false) {
    notice.classList.toggle("is-error", isError);
    const icon = document.createElement("i");
    icon.className = isError ? "bi bi-exclamation-circle" : "bi bi-shield-check";
    icon.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = message;
    notice.replaceChildren(icon, text);
  }

  function showChatError(message) {
    chatError.textContent = message;
    chatError.hidden = !message;
  }

  function updateSendState() {
    sendButton.disabled = isResponding || !messageInput.value.trim();
    messageInput.disabled = isResponding;
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 140)}px`;
  }

  function createClientMessageId() {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function upsertConversation(conversation) {
    const index = conversations.findIndex((item) => item._id === conversation._id);
    if (index === -1) {
      conversations.unshift(conversation);
    } else {
      conversations[index] = { ...conversations[index], ...conversation };
    }
    conversations.sort((first, second) => (
      new Date(second.updatedAt || second.createdAt).getTime()
      - new Date(first.updatedAt || first.createdAt).getTime()
    ));
    renderConversations();
  }

  function getConversationRow(id) {
    return [...conversationList.querySelectorAll(".conversation-item")]
      .find((row) => row.dataset.conversationId === id);
  }

  function renderConversations() {
    conversationList.replaceChildren();
    conversations.forEach((conversation) => {
      const row = document.createElement("div");
      row.className = `conversation-item${conversation._id === activeConversationId ? " active" : ""}`;
      row.setAttribute("role", "listitem");
      row.dataset.conversationId = conversation._id;
      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "conversation-select";
      selectButton.setAttribute("aria-current", conversation._id === activeConversationId ? "true" : "false");
      const icon = document.createElement("i");
      icon.className = "bi bi-chat-left-text";
      icon.setAttribute("aria-hidden", "true");
      const title = document.createElement("span");
      title.textContent = conversation.title || "New conversation";
      selectButton.append(icon, title);
      selectButton.addEventListener("click", () => selectConversation(conversation._id));

      const menuToggle = document.createElement("button");
      menuToggle.type = "button";
      menuToggle.className = "conversation-menu-toggle";
      menuToggle.setAttribute("aria-label", `More options for ${title.textContent}`);
      menuToggle.setAttribute("aria-haspopup", "menu");
      menuToggle.setAttribute("aria-expanded", String(openConversationMenuId === conversation._id));
      menuToggle.title = "Conversation options";
      menuToggle.disabled = isResponding || deletingConversationId === conversation._id;
      menuToggle.innerHTML = '<i class="bi bi-three-dots-vertical" aria-hidden="true"></i>';

      const menu = document.createElement("div");
      menu.className = "conversation-menu";
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-label", `Options for ${title.textContent}`);
      menu.hidden = openConversationMenuId !== conversation._id;
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "conversation-menu-delete";
      deleteButton.setAttribute("role", "menuitem");
      deleteButton.tabIndex = 0;
      deleteButton.disabled = isResponding || deletingConversationId === conversation._id;
      deleteButton.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i><span>Delete conversation</span>';
      menu.appendChild(deleteButton);

      menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        openConversationMenuId = openConversationMenuId === conversation._id
          ? null
          : conversation._id;
        renderConversations();
        if (openConversationMenuId) {
          getConversationRow(conversation._id)?.querySelector(".conversation-menu-delete")?.focus();
        }
      });
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openConversationMenuId = null;
        renderConversations();
        deleteConversation(conversation._id);
      });
      menu.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
          event.preventDefault();
          deleteButton.focus();
        }
      });
      row.append(selectButton, menuToggle, menu);
      conversationList.appendChild(row);
    });

    conversationEmpty.hidden = conversations.length > 0;
    conversationCount.textContent = String(conversations.length);
  }

  async function deleteConversation(id) {
    const conversation = conversations.find((item) => item._id === id);
    if (!conversation) return;
    const title = conversation.title || "New conversation";
    if (!window.confirm(`Delete "${title}" and all its messages? This cannot be undone.`)) {
      getConversationRow(id)?.querySelector(".conversation-menu-toggle")?.focus();
      return;
    }

    deletingConversationId = id;
    renderConversations();
    showChatError("");
    try {
      await Api.stylist.deleteConversation(id);
      const index = conversations.findIndex((item) => item._id === id);
      if (index !== -1) conversations.splice(index, 1);

      if (activeConversationId === id) {
        activeConversationId = null;
        activeConversation = null;
        conversationLoadId += 1;
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        activeTitle.textContent = "Your Personal AI Stylist";
        showWelcome();
      }
      renderConversations();
      closeSidebar();
    } catch (error) {
      showChatError(`We couldn't delete this conversation. ${error.message}`);
    } finally {
      deletingConversationId = null;
      renderConversations();
    }
  }

  function placeholderImage() {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="100%" height="100%" fill="#f0ece5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9a6037" font-family="sans-serif" font-size="14">No image</text></svg>'
    )}`;
  }

  function appendOutfits(content, responseData) {
    (Array.isArray(responseData?.outfits) ? responseData.outfits : []).forEach((outfit) => {
      const card = document.createElement("article");
      card.className = "ai-outfit-card";
      const title = document.createElement("h4");
      title.textContent = outfit.name || outfit.title || "Outfit idea";
      card.appendChild(title);

      const items = document.createElement("div");
      items.className = "ai-outfit-items";
      (Array.isArray(outfit.items) ? outfit.items : []).forEach((item) => {
        const itemCard = document.createElement("div");
        itemCard.className = "ai-outfit-item";
        const image = document.createElement("img");
        image.src = item.imageUrl || item.imageBase64 || placeholderImage();
        image.alt = item.name ? `${item.name} clothing item` : "Wardrobe item";
        image.onerror = () => {
          image.onerror = null;
          image.src = placeholderImage();
        };
        const name = document.createElement("h5");
        name.textContent = item.name || "Wardrobe item";
        const category = document.createElement("span");
        category.textContent = item.category || "Clothing";
        itemCard.append(image, name, category);
        items.appendChild(itemCard);
      });
      if (items.childElementCount) card.appendChild(items);

      if (outfit.reason) {
        const reason = document.createElement("p");
        reason.className = "ai-outfit-reason";
        reason.textContent = outfit.reason;
        card.appendChild(reason);
      }

      if (Array.isArray(outfit.stylingTips) && outfit.stylingTips.length) {
        const tipsTitle = document.createElement("strong");
        tipsTitle.className = "ai-outfit-tips-title";
        tipsTitle.textContent = "Stylist tip";
        const tips = document.createElement("ul");
        tips.className = "ai-outfit-tips";
        outfit.stylingTips.forEach((tip) => {
          const tipItem = document.createElement("li");
          tipItem.textContent = tip;
          tips.appendChild(tipItem);
        });
        card.append(tipsTitle, tips);
      }

      content.appendChild(card);
    });
  }

  function appendMessage(message, { animate = true } = {}) {
    const row = document.createElement("article");
    row.className = `message-row ${message.role}${message.status === "failed" ? " failed" : ""}`;
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
    meta.textContent = message.role === "user" ? "You" : "Closetly Stylist";
    const text = document.createElement("div");
    text.textContent = message.content || message.responseData?.response || "";
    content.append(meta, text);

    if (message.role === "assistant") {
      appendOutfits(content, message.responseData);
    }

    if (message.status === "failed" && message.clientMessageId) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "message-retry";
      retry.textContent = "Message failed. Try again";
      retry.addEventListener("click", () => {
        showChatError("");
        sendMessage(message.content, message.clientMessageId);
      });
      content.appendChild(retry);
    }

    row.append(avatar, content);
    messageList.appendChild(row);
  }

  function showMessages(conversation) {
    welcomeScreen.hidden = true;
    messageList.hidden = false;
    messageList.replaceChildren();
    (conversation.messages || []).forEach((message) => appendMessage(message, { animate: false }));
    scrollToLatest();
  }

  function showWelcome() {
    welcomeScreen.hidden = false;
    messageList.hidden = true;
    messageList.replaceChildren();
  }

  function scrollToLatest() {
    requestAnimationFrame(() => {
      chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
    });
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

  async function selectConversation(id) {
    if (id === activeConversationId && activeConversation) {
      closeSidebar();
      return;
    }

    activeConversationId = id;
    activeConversation = null;
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    activeTitle.textContent = "Loading conversation…";
    messageList.hidden = false;
    welcomeScreen.hidden = true;
    messageList.replaceChildren();
    renderConversations();
    showChatError("");
    closeSidebar();
    const loadId = ++conversationLoadId;

    try {
      const conversation = await Api.stylist.getConversation(id);
      if (loadId !== conversationLoadId) return;
      activeConversation = conversation;
      activeTitle.textContent = conversation.title || "New conversation";
      upsertConversation(conversation);
      if (conversation.messages?.length) showMessages(conversation);
      else showWelcome();
    } catch (error) {
      if (loadId !== conversationLoadId) return;
      if (error.status === 404) {
        const index = conversations.findIndex((item) => item._id === id);
        if (index !== -1) conversations.splice(index, 1);
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        activeConversationId = null;
        renderConversations();
      }
      activeTitle.textContent = "Your Personal AI Stylist";
      showWelcome();
      showChatError(`We couldn't open this conversation. ${error.message}`);
    }
  }

  async function startNewChat() {
    newChatButton.disabled = true;
    showChatError("");
    try {
      const conversation = await Api.stylist.createConversation();
      activeConversation = conversation;
      activeConversationId = conversation._id;
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation._id);
      activeTitle.textContent = conversation.title || "New conversation";
      upsertConversation(conversation);
      showWelcome();
      closeSidebar();
      messageInput.focus();
    } catch (error) {
      showChatError(`We couldn't create a conversation. ${error.message}`);
    } finally {
      newChatButton.disabled = false;
    }
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

  async function sendMessage(message, clientMessageId = createClientMessageId()) {
    if (!message || isResponding) return;
    isResponding = true;
    newChatButton.disabled = true;
    updateSendState();
    renderConversations();

    showChatError("");
    if (!activeConversationId) {
      try {
        const conversation = await Api.stylist.createConversation();
        activeConversation = conversation;
        activeConversationId = conversation._id;
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation._id);
        upsertConversation(conversation);
      } catch (error) {
        showChatError(`We couldn't create a conversation. ${error.message}`);
        isResponding = false;
        newChatButton.disabled = false;
        updateSendState();
        renderConversations();
        return;
      }
    }

    const requestConversationId = activeConversationId;
    if (!activeConversation || activeConversation._id !== requestConversationId) {
      try {
        activeConversation = await Api.stylist.getConversation(requestConversationId);
      } catch (error) {
        showChatError(`We couldn't open this conversation. ${error.message}`);
        isResponding = false;
        newChatButton.disabled = false;
        updateSendState();
        renderConversations();
        return;
      }
    }

    const requestConversation = activeConversation;
    let userMessage = requestConversation.messages.find(
      (item) => item.clientMessageId === clientMessageId && item.role === "user"
    );
    if (!userMessage) {
      userMessage = {
        role: "user",
        content: message,
        clientMessageId,
        status: "processing",
      };
      requestConversation.messages.push(userMessage);
    } else {
      userMessage.status = "processing";
    }

    if (requestConversation.messageCount === 0 && requestConversation.title === "New conversation") {
      requestConversation.title = message.slice(0, 100);
      activeTitle.textContent = requestConversation.title;
    }

    welcomeScreen.hidden = true;
    messageList.hidden = false;
    showMessages(requestConversation);
    upsertConversation(requestConversation);
    newChatButton.disabled = true;
    updateSendState();
    typingRow = showTypingIndicator();

    try {
      const result = await Api.stylist.sendMessage(
        requestConversationId,
        message,
        clientMessageId
      );
      const responseConversation = result.conversation;
      upsertConversation(responseConversation);
      if (activeConversationId === requestConversationId) {
        activeConversation = responseConversation;
        activeTitle.textContent = responseConversation.title || "Your Personal AI Stylist";
        showMessages(responseConversation);
        messageInput.focus();
      }
    } catch (error) {
      userMessage.status = "failed";
      upsertConversation(requestConversation);
      if (activeConversationId === requestConversationId) {
        activeConversation = requestConversation;
        showMessages(requestConversation);
        showChatError(
          `The stylist couldn't answer right now. ${error.message} You can retry this message safely.`
        );
      }
    } finally {
      typingRow?.remove();
      typingRow = null;
      isResponding = false;
      newChatButton.disabled = false;
      updateSendState();
      renderConversations();
    }
  }

  async function loadConversations() {
    newChatButton.disabled = true;
    setNotice("Loading your saved conversations…");
    try {
      const result = await Api.stylist.getConversations({ limit: 100, skip: 0 });
      conversations.splice(0, conversations.length, ...result.conversations);
      renderConversations();
      setNotice("Conversations are saved to your account. Only you can access them.");

      const savedId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
      if (savedId && conversations.some((item) => item._id === savedId)) {
        await selectConversation(savedId);
      } else {
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        showWelcome();
      }
    } catch (error) {
      setNotice(`We couldn't load your conversations. ${error.message}`, true);
      renderConversations();
      showWelcome();
    } finally {
      newChatButton.disabled = false;
    }
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
  document.addEventListener("click", () => {
    if (openConversationMenuId) {
      openConversationMenuId = null;
      renderConversations();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (openConversationMenuId) {
        const menuId = openConversationMenuId;
        openConversationMenuId = null;
        renderConversations();
        getConversationRow(menuId)?.querySelector(".conversation-menu-toggle")?.focus();
      }
      closeSidebar();
    }
  });

  renderConversations();
  updateSendState();
  loadConversations();
});
