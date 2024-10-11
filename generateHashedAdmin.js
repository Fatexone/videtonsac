import bcrypt from 'bcrypt';

const password = 'monmotdepasse';  // Remplacez par votre mot de passe
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash généré:', hash);
});
