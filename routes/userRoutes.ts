import express from "express";
import { UserController } from "../controllers";
import { registerValidation, loginValidation } from "../validations";
import { handleValidationErrors, checkAuth } from "../middleware/index";

const router = express.Router();

//Api for Users
router.post(
    "/login",
    loginValidation,
    handleValidationErrors,
    UserController.login
);

router.post(
    "/register",
    registerValidation,
    handleValidationErrors,
    UserController.register
);

router.post("/users/add/:id", checkAuth, UserController.addFriend);

router.post("/users/takeAdmin", checkAuth, UserController.addAdmin);

router.delete("/users/add/:id", checkAuth, UserController.removeFriend);

router.get("/users/me", checkAuth, UserController.getMe);

router.get("/users/:id", UserController.getOneUser);

router.get("/users/search/:name", UserController.searchUserByName);

router.get("/leaderboard", UserController.getUsers);

router.patch("/users/me", checkAuth, UserController.updateMe);

router.patch("/users/me/pass", checkAuth, UserController.updatePass);

router.patch("/users/ban/:id", checkAuth, UserController.updateBanStatus);

router.patch("/users/giveAdmin/:id", checkAuth, UserController.updateUserRole);






export default router;