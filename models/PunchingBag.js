import mongoose from 'mongoose';

const punchingBagSchema = new mongoose.Schema({
  hits: {
    type: Number,
    default: 0  // Commence avec 0 coups
  },
  image: {
    type: String,
    default: '/images/boxing-bag-blue.png'  // Image par défaut au début
  }
});

const PunchingBag = mongoose.model('PunchingBag', punchingBagSchema);

export default PunchingBag;
