const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userType: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: function() { return this.userType === 'teacher'; }
  },
  subjects: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.userType !== 'teacher' || (Array.isArray(v) && v.length <= 3);
      },
      message: 'A teacher can have up to 3 subjects'
    }
  },
  contactNumber: {
    type: String,
    required: function() { return this.userType === 'teacher'; }
  },
  course: {
    type: String,
    required: function() { return this.userType === 'student'; }
  },
  passwordHash: {
    type: String,
    required: true
  },
  periodOverview: [
    {
      day: {
        type: String,
        required: true
      },
      period: {
        type: Number,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      room: {
        type: String
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
