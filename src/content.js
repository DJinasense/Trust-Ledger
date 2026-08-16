// Scrapes active chat interfaces dynamically
function scrapeActiveChat() {
  const host = window.location.hostname;
  let promptText = "";
  let responseText = "";
  let modelName = "unknown-model";

  if (host.includes("chatgpt.com")) {
    modelName = "chatgpt";
    const userTurns = document.querySelectorAll('[data-message-author-role="user"]');
    const assistantTurns = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (userTurns.length && assistantTurns.length) {
      promptText = userTurns[userTurns.length - 1].innerText;
      responseText = assistantTurns[assistantTurns.length - 1].innerText;
    }
  } else if (host.includes("claude.ai")) {
    modelName = "claude";
    const chatBlocks = document.querySelectorAll('.font-claude-message');
    // Claude alternates blocks; check classes or datasets to separate human/assistant
    const textBlocks = Array.from(chatBlocks).map(el => el.innerText);
    if (textBlocks.length >= 2) {
      promptText = textBlocks[textBlocks.length - 2];
      responseText = textBlocks[textBlocks.length - 1];
    }
  } else if (host.includes("kimi") || host.includes("moonshot.cn")) {
    modelName = "kimi";
    // Target common class patterns used by Kimi for chat bubble components
    const messages = document.querySelectorAll('[class*="message-item"], [class*="chat-bubble"]');
    if (messages.length >= 2) {
      promptText = messages[messages.length - 2].innerText;
      responseText = messages[messages.length - 1].innerText;
    }
  }

  if (promptText && responseText) {
    chrome.runtime.sendMessage({
      type: "NEW_AI_INTERACTION",
      data: {
        model: modelName,
        prompt: promptText.trim(),
        response: responseText.trim(),
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Simple MutationObserver to capture new turns when the DOM finishes updating
let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scrapeActiveChat, 1500); 
});

observer.observe(document.body, { childList: true, subtree: true });
const safeTrim = (el) => el ? el.innerText.trim() : "";

// Usage example inside your ChatGPT condition block:
if (userTurns.length && assistantTurns.length) {
  promptText = safeTrim(userTurns[userTurns.length - 1]);
  responseText = safeTrim(assistantTurns[assistantTurns.length - 1]);
}
