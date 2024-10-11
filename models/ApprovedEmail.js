import mongoose from 'mongoose';

const approvedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

const ApprovedEmail = mongoose.model('ApprovedEmail', approvedEmailSchema);

export default ApprovedEmail;
