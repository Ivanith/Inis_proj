import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

export const register = async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      userName: req.body.userName,
      passwordHash: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: "20d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "register error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return req.status(404).json({
        message: "User not found",
      });
    }

    const isValidPass = await bcrypt.compare(
      req.body.password,
      user._doc.passwordHash
    );

    if (!isValidPass) {
      return res.status(400).json({
        message: "Login or pass error",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: "20d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "autorization error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    res.json({ user: userData });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "permission denied",
    });
  }
};

// не готово

// export const updateMe = async (req, res) => {
//   try {
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       req.userId,
//       {
//         activity: req.body.activity,
//         country: req.body.country,
//         city: req.body.city,
//         age: req.body.age,
//         description: req.body.description,
//       },
//       { new: true } // This option returns the updated document
//     );

//     if (!updatedUser) {
//       return res.status(404).json({
//         message: "user not found",
//       });
//     }

//     const { passwordHash, ...userData } = updatedUser._doc;
//     res.json(userData);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "update error",
//     });
//   }
// };

// export const getUsers = async (req, res) => {
//   const skip = req.query.skip ? Number(req.query.skip) : 0;
//   const default_lim = 10;
//   const date = req.query.date;
//   const direction = req.query.direction;

//   try {
//     const sortOptions = {};

//     if (date) {
//       sortOptions.createdAt = date;
//     } else if (direction) {
//       sortOptions.fullName = direction;
//     }

//     const excludeFields = ["email", "passwordHash", "likedPosts"];

//     const users = await UserModel.find()
//       .select(excludeFields.map((field) => "-" + field).join(" "))
//       .skip(skip)
//       .limit(default_lim)
//       .collation({ locale: "en", strength: 1 }) //ignore register
//       .sort(sortOptions)
//       .exec();
//     res.json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "users recieve error",
//     });
//   }
// };

// export const getOneUser = async (req, res) => {
//   const skip = req.query.skip ? Number(req.query.skip) : 0;
//   const default_lim = 10;

//   try {
//     //user by id part
//     const userId = req.params.id;
//     const excludeFields = ["passwordHash", "email", "likedPosts"];
//     const user = await UserModel.findById({ _id: userId }).select(
//       excludeFields.map((field) => "-" + field).join(" ")
//     );
//     //posts from user part

//     const posts = await PostModel.find({ user: userId })
//       .skip(skip)
//       .limit(default_lim)
//       .exec();

//     const { passwordHash, ...userData } = user._doc;

//     res.json({ user: userData, posts });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "permission denied",
//     });
//   }
// };

// export const searchUserByName = async (req, res) => {
//   const name = new RegExp(req.params?.name, "i");

//   if (name !== "") {
//     try {
//       const excludeFields = ["passwordHash", "email", "likedPosts"];
//       const search_results = await UserModel.find({ fullName: name }).select(
//         excludeFields.map((field) => "-" + field).join(" ")
//       );
//       res.status(200).json(search_results);
//     } catch (error) {
//       console.log(error);
//       res.status(404).json({ message: "No mached user found" });
//     }
//   } else {
//     res.status(404).json({ message: "Username for search not provided" });
//   }
// };
