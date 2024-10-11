document.addEventListener('DOMContentLoaded', () => {
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutSection = document.getElementById('aboutSection');
  
    // Ajout du listener pour le bouton "À propos"
    if (aboutBtn && aboutSection) {
      aboutBtn.addEventListener('click', () => {
        console.log("Bouton 'À propos' cliqué"); // Pour vérifier que le clic est détecté
        aboutSection.classList.toggle('visible');
        aboutSection.classList.toggle('hidden');
      });
    } else {
      console.error("Bouton ou section 'À propos' non trouvés.");
    }
  });
  