import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false  // Par défaut, l'utilisateur n'est pas approuvé
  },
  isAdmin: {
    type: Boolean,
    default: false  // Par défaut, l'utilisateur n'est pas administrateur
  }
});

const User = mongoose.model('User', userSchema);
export default User;  // Utilisation de l'export par défaut
