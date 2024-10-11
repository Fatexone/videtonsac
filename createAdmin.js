import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';  // Assure-toi que le chemin est correct

dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur de connexion à MongoDB', err));

async function createAdmin() {
  const email = 'brice.faradji@gmail.com';  // L'email de l'administrateur
  const password = 'Fatex11075';  // Ton mot de passe administrateur
  const hashedPassword = await bcrypt.hash(password, 10);  // Hasher le mot de passe

  const adminUser = new User({
    email: email,
    password: hashedPassword,
    isAdmin: true  // Défini comme administrateur
  });

  try {
    await adminUser.save();  // Sauvegarde dans MongoDB
    console.log('Utilisateur administrateur créé avec succès:', adminUser);
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
  }

  mongoose.connection.close();  // Ferme la connexion après création
}

// Exécuter la fonction
createAdmin();
