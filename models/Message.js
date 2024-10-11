import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  combo: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // Tableau des utilisateurs qui ont liké
  unlikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // Tableau des utilisateurs qui ont unliké
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
