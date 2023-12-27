import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    requrie: true,
    unique: true,
    minLength: 5,
  },
  email: {
    type: String,
    requrie: true,
    unique: true,
    minLength: 5,
  },
  authentication: {
    password: {
      type: String,
      require: true,
    },
    salt: {
      type: String,
    },
    sessionToken: {
      type: String,
    },
  },
});

export const User = mongoose.model("Users", userSchema);

export const getUsers = async () => await User.find();

export const getUserById = async (id: string) => await User.findById(id);

export const getUserByEmail = async (email: string) =>
  await User.findOne({ email });

export const getUserBySessionToken = async (sessionToken: string) =>
  await User.findOne({
    "authentication.sessionToken": sessionToken,
  });

export const createUser = async (value: Record<string, any>) =>
  await new User(value).save().then((user) => user.toObject());

export const deletUserById = async (id: string) =>
  await User.findByIdAndDelete({ _id: id });

export const getUserByIdAndUpdate = async (
  id: string,
  value: Record<string, any>
) => await User.findByIdAndUpdate(id, value);
