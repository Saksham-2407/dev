const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestionsContainer = document.querySelector(".suggestion-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const sendMessageButton = document.querySelector("#send-message-button");
const typingInput = document.querySelector(".typing-input");

const API_KEY = "AIzaSyAxibrG8FYWzFnj-OT46E3LaemAbxwDxeI"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let userMessage = null;
let isResponseGenerating = false;

// Toggle theme
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerHTML = `<span class="material-symbols-rounded">${isLightMode ? "dark_mode" : "light_mode"}</span>`;
});

// Load saved chats and theme
const loadDataFromLocalStorage = () => {
    const savedChats = localStorage.getItem("saved-chats");
    const isLightMode = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerHTML = `<span class="material-symbols-rounded">${isLightMode ? "dark_mode" : "light_mode"}</span>`;

    if (savedChats) {
        chatContainer.innerHTML = savedChats;
        suggestionsContainer.classList.add("hidden"); // Hide suggestions if there is chat history
    }
};

// Create message element
const createMessageElement = (content, className) => {
    const div = document.createElement("div");
    div.classList.add("message", className);
    div.innerHTML = `<div class="message-content"><p class="text">${content}</p></div>`;
    return div;
};

// Show typing effect
const showTypingEffect = (text, textElement) => {
    const words = text.split(" ");
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            localStorage.setItem("saved-chats", chatContainer.innerHTML);
        }
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
};

// Generate API response
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: userMessage }] }],
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
        showTypingEffect(apiResponse, textElement);
    } catch (error) {
        console.error("Error:", error);
        isResponseGenerating = false;
        textElement.innerText = "Failed to generate response. Please try again.";
        textElement.parentElement.classList.add("error");
    }
};

// Handle outgoing message
const handleOutgoingMessage = () => {
    userMessage = typingInput.value.trim();
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    // Hide suggestions when user sends a message
    suggestionsContainer.classList.add("hidden");

    const outgoingMessageDiv = createMessageElement(userMessage, "outgoing");
    chatContainer.appendChild(outgoingMessageDiv);

    const incomingMessageDiv = createMessageElement("", "incoming");
    chatContainer.appendChild(incomingMessageDiv);

    typingForm.reset();
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
};

// Delete chat history
deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chats?")) {
        localStorage.removeItem("saved-chats");
        chatContainer.innerHTML = "";
        suggestionsContainer.classList.remove("hidden"); // Show suggestions again
    }
});

// Handle form submission
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Handle send button click
sendMessageButton.addEventListener("click", (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Load data on page load
loadDataFromLocalStorage();
