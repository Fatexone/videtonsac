document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables for used images
    let usedImages = [];
    const totalImages = 100; // Total number of images

    // Function to initialize the used images array
    function initializeImages() {
        usedImages = Array.from({ length: totalImages }, (_, i) => i + 1); // Fill with indices from 1 to 100
        usedImages = shuffleArray(usedImages); // Shuffle the array for random order
    }
    
    // Function to shuffle the array (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Call this function to initialize images when the page loads
    initializeImages();

    const punchingBagContainer = document.getElementById('impact-container');
    const gloveButton = document.getElementById('boxing-glove');
    const messageInput = document.querySelector('textarea[name="message"]');

    // Initialize sound effects using Howler.js
    const punchSound = new Howl({
        src: ['/sounds/punch.mp3'],
        volume: 0.5,
    });

    // Disable the button if the message is empty
    messageInput.addEventListener('input', () => {
        gloveButton.disabled = messageInput.value.trim() === '';
    });

    // Like button functionality
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const messageId = button.getAttribute('data-message-id');
            try {
                const response = await fetch('/like', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId })
                });

                const data = await response.json();
                if (data.success) {
                    const likeCountElement = button.querySelector('.like-count');
                    likeCountElement.textContent = data.likes;

                    const unlikeCountElement = button.nextElementSibling.querySelector('.unlike-count');
                    unlikeCountElement.textContent = data.unlikes;
                } else {
                    alert('Erreur lors de la mise à jour du like.');
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour du like:', error);
            }
        });
    });

    // Unlike button functionality
    document.querySelectorAll('.unlike-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const messageId = button.getAttribute('data-message-id');
            try {
                const response = await fetch('/unlike', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId })
                });

                const data = await response.json();
                if (data.success) {
                    const unlikeCountElement = button.querySelector('.unlike-count');
                    unlikeCountElement.textContent = data.unlikes;

                    const likeCountElement = button.previousElementSibling.querySelector('.like-count');
                    likeCountElement.textContent = data.likes;
                } else {
                    alert('Erreur lors de la mise à jour du unlike.');
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour du unlike:', error);
            }
        });
    });

    // Button click event for glove
    gloveButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const messageText = messageInput.value.trim();
        const wordCount = messageText.split(/\s+/).length;

        // Check if the message has less than 10 words
        if (wordCount < 10) {
            alert("Votre message doit contenir au moins 10 mots pour être posté.");
            return;
        }

        // Check for forbidden words via API
        try {
            const forbiddenResponse = await fetch('/check-forbidden-words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!forbiddenResponse.ok) {
                throw new Error('Failed to check for forbidden words.');
            }

            const forbiddenData = await forbiddenResponse.json();
            if (forbiddenData.containsForbiddenWords) {
                alert("Votre message contient des mots inappropriés. Veuillez le modifier.");
                return;
            }
        } catch (error) {
            console.error("Erreur lors de la vérification des mots interdits :", error);
            alert("Une erreur est survenue lors de la vérification des mots interdits. Veuillez réessayer.");
            return;
        }

        // Play punch sound
        punchSound.play();

        // Generate a random hit and display the corresponding phrase
        const randomHit = getRandomHit();
        const phrase = generatePhrase(randomHit.combo);
        window.displayHitMessage(phrase);

        // Add an impact on the bag
        const impact = createImpact();
        punchingBagContainer.appendChild(impact);

        // Call the physics punch function
        punchBag();

        // Send the message to the server via AJAX
        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    combo: randomHit.combo,
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la soumission du message');
            }

            const data = await response.json();
            if (data.success) {
                const image = getBoxingImage(); // Get a new image every message
                updateBagVisual(image); // Update the bag image dynamically
                updateHitCounter(data.bag.hits); // Update the hit counter
                displayNewMessage('Utilisateur', messageInput.value, randomHit.combo); // Display the new message
                messageInput.value = ''; // Clear the input field after submission
            } else {
                alert("Erreur lors de l'enregistrement des données");
            }

        } catch (error) {
            console.error("Erreur lors de l'envoi du coup :", error);
            alert("Une erreur est survenue lors de l'envoi du coup. Veuillez réessayer.");
        }
    });

    // Function to generate a random hit with new combinations
    function getRandomHit() {
        const hits = [
            { combo: "Gauche", description: "Un direct du gauche! Le début de la tempête." },
            { combo: "Droite", description: "Un crochet du droit bien placé! L’impact résonne." },
            { combo: "GG", description: "Double gauche percutant! L'orage gronde." },
            { combo: "DD", description: "Deux crochets du droit successifs! Ça claque comme un coup de tonnerre." },
            { combo: "GD", description: "Un enchaînement gauche-droite fulgurant! Le chaos s'approche." },
            { combo: "DG", description: "Droite-Gauche, ça fait mal! La précision rencontre la puissance." },
            { combo: "GGG", description: "Trois gauche, une rafale! L'adversaire vacille, il ne s’y attendait pas." },
            { combo: "GGD", description: "Deux gauche, une droite! L'équilibre bascule, c’est la danse du chaos." },
            { combo: "GDD", description: "Une gauche, deux droites! L'uppercut final est imminent." },
            { combo: "GDG", description: "Une gauche, une droite, une gauche! L'art du déséquilibre est en marche." },
            { combo: "DDD", description: "Trois droites successives! Un ouragan en pleine face." },
            { combo: "DGG", description: "Une droite, deux gauche! La symphonie des coups bien placés." },
            { combo: "DDG", description: "Deux droites, une gauche! L'adversaire ne sait plus où donner de la tête." },
            { combo: "DGD", description: "Une droite, une gauche, une droite! Le rythme du chaos est parfait." }
        ];

        return hits[Math.floor(Math.random() * hits.length)];
    }

    // Function to create a realistic visual impact
    function createImpact() {
        const impact = document.createElement('div');
        impact.classList.add('impact');

        // Impact image
        const impactImage = document.createElement('img');
        impactImage.src = '/images/impact-crack.png'; // Ensure the path is correct
        impactImage.style.width = '60px';
        impactImage.style.height = '60px';

        impact.appendChild(impactImage);

        // Generate a random position for the impact on the bag
        const posX = Math.random() * (punchingBagContainer.offsetWidth - 60);
        const posY = Math.random() * (punchingBagContainer.offsetHeight - 60);

        impact.style.left = `${posX}px`;
        impact.style.top = `${posY}px`;
        impact.style.position = 'absolute';

        // Add a fade-out effect
        setTimeout(() => {
            impact.classList.add('fade-out');
        }, 300);

        // Remove the impact from DOM after fade-out
        setTimeout(() => {
            impact.remove();
        }, 1000);

        return impact;
    }

    // Function to make the bag move using an animation
    function punchBag() {
        const bagElement = document.getElementById('punching-bag');
        if (bagElement) {
            bagElement.classList.add('punching-bag-hit');

            // Remove the animation after it's done
            setTimeout(() => {
                bagElement.classList.remove('punching-bag-hit');
            }, 500);
        } else {
            console.error('Bag element not found!');
        }
    }

    // Update the getBoxingImage function
    function getBoxingImage() {
        if (usedImages.length === 0) {
            alert("All images have been used. Resetting the list.");
            initializeImages(); // Reset the images if all have been used
        }

        const imageIndex = usedImages.pop(); // Get and remove the last index from the array
        return `/images/IM${imageIndex}.png`; // Return the path of the selected image
    }

    // Function to update the bag image based on the hits
    function updateBagVisual(image) {
        const bagElement = document.getElementById('punching-bag');
        if (bagElement) {
            bagElement.src = image; // Update the bag image
        } else {
            console.warn('Bag element not found!');
        }
    }

    // Function to update the hit counter in the interface
    function updateHitCounter(hits) {
        const hitCounterElement = document.querySelector('.hit-counter');
        if (hitCounterElement) {
            hitCounterElement.textContent = `Coups reçus : ${hits}`;
        } else {
            console.warn('Hit counter element not found!');
        }
    }

    // Function to display the new message in the list
    function displayNewMessage(username, message, combo) {
        const messagesList = document.querySelector('.messages-list');
        if (messagesList) {
            const newMessageItem = document.createElement('li');
            newMessageItem.classList.add('message-item');
            newMessageItem.innerHTML = `
                <strong>${username} :</strong> ${message}<br>
                <small>Combinaison : ${combo} - ${new Date().toLocaleString()}</small>
            `;
            messagesList.prepend(newMessageItem); // Add the message to the top of the list
        } else {
            console.warn('Messages list not found!');
        }
    }

    // Function to generate the phrase based on the combo of hits
    function generatePhrase(combo) {
        const phrases = {
            "Gauche": "Un direct du gauche! Ça, c'est pour commencer doucement.",
            "Droite": "Un crochet du droit bien placé, attention aux esquives!",
            "GG": "Double gauche percutant! On ne rigole plus.",
            "DD": "Deux crochets du droit successifs! La rage se fait sentir.",
            "GD": "Un enchaînement gauche-droite fulgurant, la victoire est proche.",
            "DG": "Droite-Gauche, ça fait mal! Ça va laisser des traces.",
            "GGG": "Trois gauche, une rafale! L'adversaire vacille.",
            "GGD": "Deux gauche, une droite! L'équilibre bascule.",
            "GDD": "Une gauche, deux droites! L'uppercut final est imminent.",
            "GDG": "Une gauche, une droite, une gauche! Déséquilibre assuré.",
            "DDD": "Trois droites! C'est un ouragan.",
            "DGG": "Une droite, deux gauches! Coup après coup.",
            "DDG": "Deux droites, une gauche! C'est la confusion totale.",
            "DGD": "Une droite, une gauche, une droite! Fulgurante précision."
        };
        return phrases[combo];
    }
});
