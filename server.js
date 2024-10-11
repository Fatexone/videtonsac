import express from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import ApprovedEmail from './models/ApprovedEmail.js';
import Message from './models/Message.js';
import User from './models/User.js';
import PunchingBag from './models/PunchingBag.js';
import { analyzeMessage } from './analysis.js'; // Correction ici

dotenv.config();





const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));




// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET,  // Assurez-vous que SESSION_SECRET est bien défini dans votre .env
  resave: false,                       // Évite de sauvegarder la session si elle n'a pas été modifiée
  saveUninitialized: false,            // N'enregistre pas la session si elle n'a pas été initialisée
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI,   // L'URL de connexion à MongoDB pour stocker les sessions
    collectionName: 'sessions'         // Ajout d'une collection spécifique pour les sessions
  }),
  cookie: {
    httpOnly: true,                    // Empêche l'accès au cookie via JavaScript côté client
    secure: process.env.NODE_ENV === 'production',  // Assurez-vous que le cookie est sécurisé en production (HTTPS)
    maxAge: 1000 * 60 * 60 * 24,       // Durée de vie du cookie (24 heures)
    sameSite: 'strict'                 // Prévient l'envoi du cookie à des requêtes provenant d'autres sites
  }
}));


// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));



  function requireAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
  
    // Ajoute cette ligne pour définir req.user
    User.findById(req.session.userId)
      .then((user) => {
        if (!user) {
          return res.redirect('/login');
        }
        req.user = user;  // Ajoute l'utilisateur trouvé dans req.user
        next();
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        res.redirect('/login');
      });
  }
  



// Routes
app.get('/', (_req, res) => res.render('index'));


// Page d'inscription
app.get('/register', (_req, res) => {
  res.render('register');
});





app.get('/analysis', async (req, res) => {
  try {
    // Récupérer tous les messages de la base de données
    const messages = await Message.find();

    // Analyser chaque message
    const analysisResults = [];
    let totalSadness = 0, totalAnger = 0, totalJoy = 0, totalDisgust = 0, totalFear = 0;
    const totalMessages = messages.length;

    for (const message of messages) {
      const analysis = await analyzeMessage(message.content); // Appel à Watson NLU
      analysisResults.push({ content: message.content, analysis });

      // Ajouter les émotions de chaque message aux totaux pour calculer les moyennes
      totalSadness += analysis.emotion.document.emotion.sadness;
      totalAnger += analysis.emotion.document.emotion.anger;
      totalJoy += analysis.emotion.document.emotion.joy;
      totalDisgust += analysis.emotion.document.emotion.disgust;
      totalFear += analysis.emotion.document.emotion.fear;
    }

    // Calculer les moyennes pour chaque émotion
    const averageSadness = totalSadness / totalMessages;
    const averageAnger = totalAnger / totalMessages;
    const averageJoy = totalJoy / totalMessages;
    const averageDisgust = totalDisgust / totalMessages;
    const averageFear = totalFear / totalMessages;

    // Calculer les scores sur 20
    const ambianceScore = Math.round((averageJoy * 20)); // Par exemple, basé sur la joie
    const wellBeingScore = Math.round(((averageJoy - averageSadness) * 20)); // Bien-être basé sur joie vs tristesse
    const stressScore = Math.round(((averageAnger + averageFear) / 2) * 20); // Stress basé sur la colère et la peur
    const motivationScore = Math.round((averageJoy * 20)); // Motivation basée sur la joie

    // Rendre la page d'analyse avec les résultats et les moyennes
    res.render('analysis', {
      analysisResults,
      averageSadness,
      averageAnger,
      averageJoy,
      averageDisgust,
      averageFear,
      ambianceScore,
      wellBeingScore,
      stressScore,
      motivationScore
    });
  } catch (err) {
    console.error('Erreur lors de l\'analyse des messages :', err);
    res.status(500).send('Erreur lors de l\'analyse');
  }
});



app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Cet utilisateur existe déjà.");
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Initialiser dailyHits à 0 et lastHitDate à null (ou à la date actuelle)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      dailyHits: 0,  // Initialiser les coups à 0
      lastHitDate: null  // Initialiser à null ou à une date précise si besoin
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    // Redirection vers la page de connexion après l'enregistrement
    res.redirect('/login');  // Rediriger vers la page de connexion
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'enregistrement.");
  }
});



// Route pour vérifier l'email
app.get('/verify', async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return res.status(400).send("Token invalide.");
  }

  // Activer le compte
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.send("Votre email a été vérifié.");
});



// Page de connexion
app.get('/login', (req, res) => {
  const errorMessage = req.session.errorMessage || null; // Récupère le message d'erreur s'il existe
  req.session.errorMessage = null; // Réinitialise le message d'erreur après l'affichage
  res.render('login', { errorMessage }); // Passe le message à la vue
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Tentative de connexion avec username:', username);

    // Rechercher l'utilisateur par son username
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Utilisateur non trouvé pour ce nom d\'utilisateur:', username);
      req.session.errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
      return res.redirect('/login');
    }

    // Vérification si l'utilisateur est approuvé
    if (!user.isApproved) {
      return res.redirect('/patience'); // Redirige vers la page de patience si non approuvé
    }

    console.log('Utilisateur trouvé:', user);
    console.log('Mot de passe en clair:', password);
    console.log('Mot de passe haché dans la base de données:', user.password);

    // Comparer le mot de passe haché
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Résultat de la comparaison du mot de passe:', isMatch);

    if (!isMatch) {
      console.log('Mot de passe incorrect pour:', username);
      req.session.errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
      return res.redirect('/login');
    }

    console.log('Mot de passe correct pour:', username);
    req.session.userId = user._id; // Stocke l'utilisateur dans la session

    if (user.isAdmin) {
      return res.redirect('/admin');
    }

    res.redirect('/boxroom');
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    req.session.errorMessage = "Une erreur est survenue. Veuillez réessayer.";
    res.redirect('/login');
  }
});

// Page de patience
app.get('/patience', (_req, res) => {
  res.render('patience'); // Rendre la vue patience.ejs
});





app.get('/watson-info', (req, res) => {
  res.render('watson-info');  // Assurez-vous que 'watson-info.ejs' est bien dans le dossier 'views'
});
















app.get('/boxroom', requireAuth, async (req, res) => {
  let bag = await PunchingBag.findOne();
  if (!bag) {
    bag = new PunchingBag({ hits: 0, color: 'brown' });
    await bag.save();
  }

  const user = await User.findById(req.session.userId);


  const messages = await Message.find().sort({ createdAt: -1 });  // Récupérer tous les messages

  res.render('boxroom', { bag, user, messages });  // Passer les messages à la vue
});




// Utility function to check for forbidden words
function containsBannedWords(message) {
  const forbiddenWords = [
      'con', 'connard', 'grosse chienne', 'arabes', 'arabe', 'sale noir', 'sale arabe', 'grosse chienne', 'bougnoule',
      'connasse', 'merde', 'putain', 'salope', 'enculé', 'fils de pute', 'batard', 'salaud', 'nique', 'niquer', 'chier', 
      'bordel', 'ta gueule', 'pédé', 'enculer', 'branleur', 'trou du cul', 'pute', 'cul', 'gouine', 'salop', 'enfoiré', 
      'bite', 'couille', 'foutre', 'bouffon', 'baiseur', 'tarlouze', 'chiennasse', 'pd', 'trouduc', 'enculeur', 'bouffonne', 'baise', 'sodomise', 
      'sodomite', 'tuer', 'PD', 'Pute', 'mére', 'gros pd', 'fils de chien', 'ta race', 'fil de pute', 'sale batard', 
      'pedophile', 'pute', 'bâtard', 'abruti', 'grognasse', 'casse-couilles', 'débile', 'fils de chien', 'tapette', 
      'fiotte', 'charogne', 'sucer', 'saleté', 'raclure', 'baiseuse', 'branlette', 'grosse chiasse','chiant', 'sale con', 'crétin', 'truie', 'enculeur de mouches'
  ];

  const words = message.toLowerCase().split(/\s+/);
  return words.some(word => forbiddenWords.includes(word));
}

// Route to check for forbidden words in a message
app.post('/check-forbidden-words', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const containsForbiddenWords = containsBannedWords(message); // Use the utility function
    res.json({ containsForbiddenWords }); // Return the result
});





app.post('/like', requireAuth, async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user._id;  // Utilise req.user._id ici

  try {
    const message = await Message.findById(messageId);

    if (!message.likes.includes(userId)) {
      message.likes.push(userId);
      message.unlikes = message.unlikes.filter(id => id.toString() !== userId.toString());  // Supprime des unlikes s'il avait déjà unliké
    }

    await message.save();
    res.json({ success: true, likes: message.likes.length, unlikes: message.unlikes.length });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du like:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du like' });
  }
});



app.post('/unlike', requireAuth, async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user._id;  // Utilise req.user._id ici

  try {
    const message = await Message.findById(messageId);

    if (!message.unlikes.includes(userId)) {
      message.unlikes.push(userId);
      message.likes = message.likes.filter(id => id.toString() !== userId.toString());  // Supprime des likes s'il avait déjà liké
    }

    await message.save();
    res.json({ success: true, likes: message.likes.length, unlikes: message.unlikes.length });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du unlike:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du unlike' });
  }
});





app.post('/submit', requireAuth, async (req, res) => {
  const { message } = req.body;
  const user = await User.findById(req.session.userId);

  // Vérifier que le message n'est pas vide ou trop court
  if (!message || message.trim().length < 5) {
      return res.status(400).send("Le message est trop court ou vide.");
  }

  // Vérifier si le message contient des mots vulgaires
  if (containsBannedWords(message)) {
      return res.status(400).send("Le message contient des mots interdits.");
  }

  // Obtenir la date d'aujourd'hui (fixée à minuit)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Fixer à minuit pour comparaison des dates

  // Réinitialiser le compteur de coups pour un nouveau jour
  if (!user.lastHitDate || new Date(user.lastHitDate).setHours(0, 0, 0, 0) < today) {
      user.dailyHits = 0; // Réinitialiser les coups à 0 pour le nouveau jour
      user.lastHitDate = today; // Mettre à jour la date du dernier coup à aujourd'hui
  }

  // Sélectionner un coup aléatoire
  const punchCombinations = ["Gauche", "Droite", "Double gauche", "Double droite", "Gauche-Droite", "Droite-Gauche"];
  const randomCombo = punchCombinations[Math.floor(Math.random() * punchCombinations.length)];

  let bag = await PunchingBag.findOne();
  if (!bag) {
      bag = new PunchingBag();
  }

  // Augmenter le nombre de coups pour le sac de boxe
  bag.hits += 1;

  // Tableau avec les paliers de coups et les images associées pour le sac de boxe
  const bagImages = [
      { hits: 100, image: '/images/boxing100.png' },
      { hits: 95, image: '/images/boxing95.png' },
      { hits: 90, image: '/images/boxing90.png' },
      { hits: 85, image: '/images/boxing85.png' },
      { hits: 80, image: '/images/boxing80.png' },
      { hits: 75, image: '/images/boxing75.png' },
      { hits: 70, image: '/images/boxing70.png' },
      { hits: 65, image: '/images/boxing65.png' },
      { hits: 60, image: '/images/boxing60.png' },
      { hits: 55, image: '/images/boxing55.png' },
      { hits: 50, image: '/images/boxing50.png' },
      { hits: 45, image: '/images/boxing45.png' },
      { hits: 40, image: '/images/boxing40.png' },
      { hits: 35, image: '/images/boxing35.png' },
      { hits: 30, image: '/images/boxing30.png' },
      { hits: 25, image: '/images/boxing25.png' },
      { hits: 20, image: '/images/boxing20.png' },
      { hits: 15, image: '/images/boxing15.png' },
      { hits: 10, image: '/images/boxing10.png' },
      { hits: 5, image: '/images/boxing5.png' }
  ];

  // Trouver l'image correspondante en fonction du nombre de coups
  const imageChange = bagImages.find(bagImage => bag.hits >= bagImage.hits);
  if (imageChange) {
      bag.image = imageChange.image; // Stocker l'image du sac dans le modèle
  }

  try {
      await bag.save();
      const newMessage = new Message({ username: user.username, content: message, combo: randomCombo });
      await newMessage.save();

      // Incrémenter le compteur de coups de l'utilisateur et sauvegarder
      user.dailyHits += 1;
      await user.save();

      // Réponse JSON avec succès et mise à jour du nombre de coups et de l'image du sac
      res.json({ success: true, bag: { hits: bag.hits, image: bag.image } });
  } catch (error) {
      console.error("Erreur lors de l'enregistrement des données:", error);
      res.status(500).send("Une erreur est survenue lors de l'enregistrement.");
  }
});





// Route pour supprimer plusieurs messages
app.post('/delete-messages', requireAuth, async (req, res) => {
  const { messageIds } = req.body;

  if (Array.isArray(messageIds) && messageIds.length > 0) {
    await Message.deleteMany({ _id: { $in: messageIds } });
  }

  res.redirect('/admin');
});

// Route pour supprimer tous les messages
app.post('/delete-all-messages', requireAuth, async (req, res) => {
  await Message.deleteMany({});
  res.redirect('/admin');
});





app.post('/logout', (req, res) => {
  const redirectPage = req.body.redirectPage || '/login';  // Obtenir la page de redirection ou par défaut aller à /login

  req.session.destroy((err) => {
    if (err) {
      return res.redirect(redirectPage); // Rediriger vers la page d'où l'utilisateur se déconnecte
    }

    res.clearCookie('connect.sid'); // Supprimer le cookie de session
    res.redirect('/login'); // Par défaut, rediriger vers la page de connexion
  });
});



app.get('/admin', requireAuth, async (_req, res) => {
  let bag = await PunchingBag.findOne();
  if (!bag) {
    bag = new PunchingBag({ hits: 0, color: 'brown' });
    await bag.save();
  }

  const messages = await Message.find().sort({ createdAt: -1 });
  const pendingUsers = await User.find({ isApproved: false });
  const allUsers = await User.find();  // Récupérer tous les utilisateurs

  res.render('admin', { bag, messages, pendingUsers, allUsers });
});


app.post('/admin/delete-user/:id', requireAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});


// Réinitialiser le sac
app.post('/reset-bag', requireAuth, async (_req, res) => {
  let bag = await PunchingBag.findOne();
  if (bag) {
    bag.hits = 0;
    bag.color = 'brown';
    await bag.save();
  }
  res.redirect('/admin');
});

// Supprimer un message
app.post('/delete-message/:id', requireAuth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (e) {
    res.status(500).send("Erreur lors de la suppression du message.");
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Page pour ajouter une adresse email approuvée (protégée)
app.get('/admin/add-email', requireAuth, (_req, res) => {
  res.render('add-email'); // Render un formulaire pour ajouter un email
});

app.post('/admin/add-user', requireAuth, async (req, res) => {
  const { email, username, password } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Cet utilisateur existe déjà.");
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer l'utilisateur avec le statut approuvé
  const newUser = new User({
    email,
    username,
    password: hashedPassword,
    isApproved: true // L'utilisateur est approuvé immédiatement
  });

  await newUser.save();
  res.redirect('/admin');
});





app.get('/a-propos', (_req, res) => {
  res.render('a-propos'); // Cette ligne rend la page a-propos.ejs
});



// Route pour gérer l'ajout d'une adresse email approuvée
app.post('/admin/add-email', requireAuth, async (req, res) => {
  const { email } = req.body;

  // Vérifier si l'email est déjà approuvé
  const existingEmail = await ApprovedEmail.findOne({ email });
  if (existingEmail) {
    return res.status(400).send("Cet email est déjà approuvé.");
  }

  // Ajouter l'email dans la base de données
  const approvedEmail = new ApprovedEmail({ email });
  await approvedEmail.save();

  res.redirect('/admin');  // Redirige vers la page d'administration
});





app.post('/analyze-message', async (req, res) => {
  const { message } = req.body;

  // Vérifier que le message est suffisamment long pour être analysé
  const wordCount = message.trim().split(/\s+/).length;
  if (!message || message.length < 10 || wordCount < 3) {
      return res.status(422).json({ error: 'Message trop court ou insuffisant pour être analysé' });
  }

  try {
      const analysis = await analyzeMessage(message);
      res.json(analysis);
  } catch (error) {
      console.error('Erreur lors de l\'analyse Watson:', error);
      res.status(500).send('Erreur interne du serveur');
  }
});



app.post('/admin/approve-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Trouver l'utilisateur par ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('Utilisateur non trouvé.');
    }

    // Marquer l'utilisateur comme approuvé
    user.isApproved = true;
    await user.save();

    // Rediriger vers la page d'administration
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de l\'approbation de l\'utilisateur.');
  }
});


