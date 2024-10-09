const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.get('uid')){
    localStorage.setItem('auth',urlParams.get('uid'))
}
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (message === '') return;

    // Add user message to chat
    addMessageToChat('HUMAN', message);
    input.value = '';

    // Show typing animation
    showTypingAnimation();

    // Send message to the assistant
    fetch('http://ec2-3-106-224-103.ap-southeast-2.compute.amazonaws.com:7800/api/miraconvo/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": localStorage.getItem('auth')
        },
        body: JSON.stringify({
            question: message,
            conversation_id: sessionStorage.getItem('convoid')
            
        })
    })
    .then(response => response.json())
    .then(result => {
        // Remove typing animation
        removeTypingAnimation();

        // Add assistant's reply to chat
        addMessageToChat('AI', result.data.content);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function formatHeadings(input) {
    let formattedString = input.replace(/\*\*(.*?)\*\*/g, '$1');
    return makeHeadingsBold(formattedString);
}

function makeHeadingsBold(text) {
    const regex = /(\d+\.\s+[^\n]*?:)/g;
    let boldedText = text.replace(regex, (match) => {
        return `<strong>${match}</strong>`;
    });
    boldedText = boldedText.replace(/\n/g, '<br>');
    return boldedText;
}

function addMessageToChat(sender, message) {
    message = formatHeadings(message);
    message = message.includes("Conclusion:") ? message.replace("Conclusion:", "<strong>Conclusion:</strong>") : message;
    const chatContainer = document.getElementById('chat-container');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    if (sender === 'HUMAN') {
        messageElement.classList.add('user-message');
    } else {
        messageElement.classList.add('assistant-message');
    }
    messageElement.innerHTML = message;


    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingAnimation() {
    const chatContainer = document.getElementById('chat-container');
    const typingElement = document.createElement('div');
    typingElement.classList.add('chat-message', 'assistant-message', 'typing');
    typingElement.textContent = 'MIRA is typing...';
    typingElement.id = 'typing-animation';

    chatContainer.appendChild(typingElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingAnimation() {
    const typingElement = document.getElementById('typing-animation');
    if (typingElement) {
        typingElement.remove();
    }
}

let currentActiveConversation = null;
async function fetchConversations() {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", localStorage.getItem('auth'));

    const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
    };
    const response = await fetch('http://ec2-3-106-224-103.ap-southeast-2.compute.amazonaws.com:7800/c/api/conversation/user/',requestOptions);
    const conversations = await response.json();
    const conversationList = document.getElementById('conversation-list');
    conversationList.innerHTML = '';
    conversations.data.conversations.forEach(conversation => {
        const div = document.createElement('div');
        div.className = 'conversation';
        div.innerText = conversation.title;
        if(sessionStorage.getItem('convoid') == conversation.id){
            currentActiveConversation = div;
            div.classList.add('active')
        }
        div.onclick = () => {
            loadConversation(conversation.id,div);
            if (currentActiveConversation) {
                currentActiveConversation.classList.remove('active');
            }
            div.classList.add('active')
            currentActiveConversation = div
        }
        conversationList.appendChild(div);
    });
}


async function loadConversation(conversationId,element) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '<div class="loader" id="loader"></div>';
    document.getElementById('loader').style.display = 'block';
    
    const myHeaders = new Headers();
    myHeaders.append("Authorization", localStorage.getItem('auth'));

    const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
    };
    const response = await fetch(`http://ec2-3-106-224-103.ap-southeast-2.compute.amazonaws.com:7800/c/api/message/convo/${conversationId}`,requestOptions);
    const conversation = await response.json();
    //const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
    conversation.data.messages.forEach(message => {
        addMessageToChat(message.role,message.content)
    });
    sessionStorage.setItem('convoid',conversationId)

}

fetchConversations();
if(sessionStorage.getItem('convoid')){
    loadConversation(sessionStorage.getItem('convoid'))
}