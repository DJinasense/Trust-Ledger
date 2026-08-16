/**
 * Trust Ledger - Content Script
 * Auto-scrapes interactions from AI interfaces and broadcasts them to the app engine.
 */

// Helper to safely extract and clean text from DOM elements
function getCleanText(element) {
  return element ? element.innerText.trim() : "";
}

// Main scraping logic based on active provider
function scrapeActiveChat() {
  const host = window.location.hostname;
  let promptText = "";
  let responseText = "";
  let modelName = "unknown-model";

  if (host.includes("chatgpt.com")) {
    modelName = "chatgpt";
    const userTurns = document.querySelectorAll('[data-message-author-role="user"]');
    const assistantTurns = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (userTurns.length > 0 && assistantTurns.length > 0) {
      promptText = getCleanText(userTurns[userTurns.length - 1]);
      responseText = getCleanText(assistantTurns[assistantTurns.length - 1]);
    }
  } else if (host.includes("claude.ai")) {
    modelName = "claude";
    const chatBlocks = document.querySelectorAll('.font-claude-message');
    if (chatBlocks.length >= 2) {
      promptText = getCleanText(chatBlocks[chatBlocks.length - 2]);
      responseText = getCleanText(chatBlocks[chatBlocks.length - 1]);
    }
  } else if (host.includes("kimi") || host.includes("moonshot.cn")) {
    modelName = "kimi";
    const messages = document.querySelectorAll('[class*="message-item"], [class*="chat-bubble"]');
    if (messages.length >= 2) {
      promptText = getCleanText(messages[messages.length - 2]);
      responseText = getCleanText(messages[messages.length - 1]);
    }
  }

  // Only broadcast if we captured a full interaction exchange
  if (promptText && responseText) {
    try {
      chrome.runtime.sendMessage({
        type: "NEW_AI_INTERACTION",
        data: {
          model: modelName,
          prompt: promptText,
          response: responseText,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Catch context invalidated errors gracefully when extension updates
      console.log("Trust Ledger connection log paused:", error.message);
    }
  }
}

// Watch for DOM changes when streaming text finishes rendering
let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scrapeActiveChat, 1500);
});

// Start tracking document layout
observer.observe(document.body, { childList: true, subtree: true });
