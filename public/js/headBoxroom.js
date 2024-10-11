// headBoxroom.js

document.addEventListener('DOMContentLoaded', () => {
    const quoteElement = document.querySelector('.scrolling-boxroom-quote');
  
    // Fonction pour afficher la phrase sur le bandeau
    function displayHitMessage(message) {
      quoteElement.textContent = message;
  
      // Animation pour faire défiler la citation
      quoteElement.style.opacity = 1;
      setTimeout(() => {
        quoteElement.style.opacity = 0;  // Masquer la citation après quelques secondes
      }, 5000);  // La phrase reste visible pendant 5 secondes
    }
  
    // Exposer la fonction pour que boxroom.js puisse l'utiliser
    window.displayHitMessage = displayHitMessage;
  });
  