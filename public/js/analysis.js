document.addEventListener('DOMContentLoaded', function () {
    // Vérifier que l'élément existe avant de récupérer les données
    const emotionChartElement = document.getElementById('emotionChart');
    if (!emotionChartElement) {
        console.warn("L'élément emotionChart est introuvable.");
        return;
    }

    // Récupérer les données des attributs data-* du canvas
    const labels = JSON.parse(emotionChartElement?.dataset?.labels || '[]');
    const joyData = JSON.parse(emotionChartElement?.dataset?.joyData || '[]');
    const sadnessData = JSON.parse(emotionChartElement?.dataset?.sadnessData || '[]');
    const angerData = JSON.parse(emotionChartElement?.dataset?.angerData || '[]');
    const disgustData = JSON.parse(emotionChartElement?.dataset?.disgustData || '[]');
    const fearData = JSON.parse(emotionChartElement?.dataset?.fearData || '[]');

    // Calculer les moyennes des émotions (pour des recommandations ou des actions dynamiques)
    const averageJoy = joyData.reduce((a, b) => a + b, 0) / joyData.length || 0;
    const averageSadness = sadnessData.reduce((a, b) => a + b, 0) / sadnessData.length || 0;
    const averageAnger = angerData.reduce((a, b) => a + b, 0) / angerData.length || 0;
    const averageDisgust = disgustData.reduce((a, b) => a + b, 0) / disgustData.length || 0;
    const averageFear = fearData.reduce((a, b) => a + b, 0) / fearData.length || 0;

    // Afficher des recommandations basées sur les moyennes des émotions
    const recommendationsContainer = document.querySelector('.recommendations ul');
    
    if (recommendationsContainer) {
        if (averageSadness > 0.5) {
            const rec = document.createElement('li');
            rec.textContent = "Encouragez une culture de soutien mutuel. Les employés montrent des signes de tristesse.";
            recommendationsContainer.appendChild(rec);
        }

        if (averageAnger > 0.5) {
            const rec = document.createElement('li');
            rec.textContent = "Travaillez sur la résolution des conflits internes. La colère est présente dans les ressentis.";
            recommendationsContainer.appendChild(rec);
        }

        if (averageJoy > 0.5) {
            const rec = document.createElement('li');
            rec.textContent = "Renforcez l'esprit d'équipe en encourageant les initiatives positives. La joie est un moteur pour la productivité.";
            recommendationsContainer.appendChild(rec);
        }

        if (averageFear > 0.5) {
            const rec = document.createElement('li');
            rec.textContent = "Apportez plus de clarté sur les objectifs de l'entreprise pour réduire l'anxiété des employés.";
            recommendationsContainer.appendChild(rec);
        }

        if (averageDisgust > 0.5) {
            const rec = document.createElement('li');
            rec.textContent = "Travaillez sur la culture d'entreprise pour réduire les sentiments de dégoût et améliorer les relations internes.";
            recommendationsContainer.appendChild(rec);
        }
    }

    // Création du graphique avec Chart.js
    const ctx = emotionChartElement.getContext('2d');
    const emotionChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Joie',
                    data: joyData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                },
                {
                    label: 'Tristesse',
                    data: sadnessData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true
                },
                {
                    label: 'Colère',
                    data: angerData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true
                },
                {
                    label: 'Dégoût',
                    data: disgustData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: true
                },
                {
                    label: 'Peur',
                    data: fearData,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1 
                }
            }
        }
    });
});

// Fonction pour analyser les messages
const analyzedMessagesCache = new Map();



async function analyzeMessage(messageContent) {
    console.log('Analyse du message:', messageContent);

    // Vérification de la longueur du message et du contenu
    const wordCount = messageContent.trim().split(/\s+/).length;
    if (messageContent.length < 10 || wordCount < 3) {
        console.warn('Message trop court ou insuffisant pour analyse:', messageContent);
        return { error: 'Message trop court ou insuffisant pour analyse' };  // Retourner un message clair
    }

    // Vérification du cache
    if (analyzedMessagesCache.has(messageContent)) {
        console.log('Message récupéré depuis le cache');
        return analyzedMessagesCache.get(messageContent);
    }

    try {
        const response = await fetch('/analyze-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageContent })
        });

        if (response.ok) {
            const analysis = await response.json();
            analyzedMessagesCache.set(messageContent, analysis); // Stocker dans le cache
            return analysis;
        } else {
            console.error('Erreur lors de l\'analyse Watson:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la requête Watson:', error);
        return null;
    }
}



// Recharger les résultats d'analyse
async function reloadAnalysisResults() {
    const messageElements = document.querySelectorAll('.message-item');

    for (const messageElement of messageElements) {
        const messageContent = messageElement.textContent.trim();
        const analysis = await analyzeMessage(messageContent);

        if (analysis) {
            // Mettre à jour les résultats d'analyse visuellement si nécessaire
        }
    }
}

reloadAnalysisResults();
