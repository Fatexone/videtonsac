document.addEventListener('DOMContentLoaded', () => {
  const quotes = [
    "Un bon coup, c’est celui qui touche quand l’autre pense être à l’abri.",
    "Garder ses bras bas, c’est oser la confiance, mais jamais baisser la vigilance.",
    "Dans le ring comme au boulot, si tu n’avances pas, tu prends les coups.",
    "La meilleure défense, c’est celle qui désarme sans avoir à frapper.",
    "Frapper fort, c'est bien. Frapper juste, c'est mieux.",
    "Au travail comme en boxe, ne jamais montrer à l'adversaire que tu fatigues.",
    "Le chaos vient quand tu oublies que chaque coup doit être calculé.",
    "Un bon manager sait quand esquiver, un bon boxeur sait quand absorber.",
    "Sur le ring, tout comme au bureau, il ne suffit pas de tenir, il faut prendre l’initiative.",
    "Entreprendre, c'est frapper là où on ne t'attend pas.",
    "Le plus dur n’est jamais le premier coup, mais celui qui vient après."
  ];

  let currentIndex = 0;
  const quoteElement = document.querySelector('.scrolling-quote');

  function showQuote() {
    // Ajoute une classe pour le fade-out
    quoteElement.classList.add('fade-out');
    
    // Attends que le fade-out soit terminé avant de changer la citation
    setTimeout(() => {
      quoteElement.textContent = quotes[currentIndex];
      currentIndex = (currentIndex + 1) % quotes.length;
      
      // Supprime le fade-out et ajoute le fade-in
      quoteElement.classList.remove('fade-out');
      quoteElement.classList.add('fade-in');
    }, 1000); // Délai pour l'effet de fade-out
  }

  // Lancer le changement de citation toutes les 7 secondes
  setInterval(showQuote, 7000);
  
  // Affiche la première citation avec un fade-in
  showQuote(); 
});
