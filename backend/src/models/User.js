import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Optimized Bcrypt Salt Rounds:
 * 10 rounds is the industry and OWASP recommendation for Node.js.
 * Higher salt rounds (e.g. 12 or 14) block the Node.js single-threaded
 * event loop for up to 1-2 seconds per request, causing massive CPU spikes
 * and degraded throughput. 10 rounds provides optimal ~100ms security/performance balance.
 */
export const BCRYPT_SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true, // MongoDB unique index constraint
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    autoIndex: true, // Ensure indexes are built in MongoDB
  }
);

// Pre-save hook to hash password with 10 salt rounds before persisting
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password against stored bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
