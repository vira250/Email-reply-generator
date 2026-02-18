console.log("Content script loaded");

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL ',  // Gmail new compose body
        '.gmail_quote .ii.gt', // Gmail quoted text
        'az6',
         'aoT',
        '[role="presentation"] .Am.Al.editable.LW-avf.tS-tW' // Gmail old compose body
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
        return '';
    }
}

function findComposeToolbar() {
    const selectors = [
        '.aDh .btC',          // Gmail new compose toolbar
        '.btC',               // Gmail old compose toolbar
        '[role="toolbar"] .btC', // Gmail dialog compose toolbar
        '.gU.Up'         // Another possible toolbar selector
    ]
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
}

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) {
        existingButton.remove();
    }

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log(" toolbar not found");
        return;
    }

    console.log("Toolbar found:");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    // button.addEventListener('click', async () => {
    //     try{
    //         button.innerHTML = 'Generating...';
    //         button.disabled = true;
    //         const emailContent = getEmailContent();

    //         const response = await fetch('http://localhost:8080/api/email/generate', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                  emailContent: emailContent,
    //                   tone: 'professional' 
    //                 })
    //         });

    //         if(!response.ok) {
    //             throw new Error("Network response was not ok");
    //         }
    //         const generatedReply = await response.text();

    //         const composeBox = document.querySelector('[role="textbox"][g_editable="true"]' 
    //         );
    //         if (composeBox) {
    //             composeBox.focus();
    //             document.execCommand('insertText', false, generatedReply);
    //         }

    //         const data = await response.json();
    //         console.log("AI Reply:", data.reply);
    //     } catch (error) {

    //     }
    // })
    button.addEventListener('click', () => {
    button.innerHTML = 'Generating...';
    button.disabled = true;

    const emailContent = getEmailContent();

    chrome.runtime.sendMessage(
        {
            type: "GENERATE_EMAIL",
            payload: {
                emailContent: emailContent,
                tone: "professional"
            }
        },
        (response) => {
            button.innerHTML = 'AI Reply';
            button.disabled = false;

            if (!response || !response.success) {
                console.error("AI generation failed");
                return;
            }

            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, response.data);
            }
        }
    );
});


    toolbar.insertBefore(button, toolbar.firstChild);
    console.log("AI Reply button injected");

}
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('.aDh, .btC, [role="dialog"]') || 
            node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if(hasComposeElements) {
            console.log("Compose window detected");
            setTimeout(injectButton, 500);
            break;
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });