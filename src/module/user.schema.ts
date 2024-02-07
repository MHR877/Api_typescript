import { Schema, model, models, Document } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto"

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt: Date;
  passwordResetToken: String;
  passwordResetExpires: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Please tell us your username!'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      // @ts-ignore
      validator: function (el) {
        // @ts-ignore
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      // @ts-ignore
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export const User = models.User || model<IUser>("Users", userSchema);

export const getUsers = async () => await User.find();

export const getUserById = async (id: string) => await User.findById(id);

export const getUserByEmail = async (email: string) =>
  await User.findOne({ email });

export const getUserBySessionToken = async (sessionToken: string) =>
  await User.findOne({
    "authentication.sessionToken": sessionToken,
  });

export const createUser = async (value: Record<string, any>) =>
  // @ts-ignore
  await new User(value).save().then((user) => user.toObject());

export const deletUserById = async (id: string) =>
  await User.findByIdAndDelete({ _id: id });

export const getUserByIdAndUpdate = async (
  id: string,
  value: Record<string, any>
) => await User.findByIdAndUpdate(id, value);
