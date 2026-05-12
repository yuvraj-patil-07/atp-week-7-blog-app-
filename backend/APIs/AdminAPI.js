import exp from "express";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { UserModel } from "../models/UserModel.js";
import { ArticleModel } from "../models/ArticleModel.js";

export const adminApp = exp.Router();

// Get all registered users
adminApp.get("/users", verifyToken("ADMIN"), async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json({ message: "Users fetched successfully", payload: users });
  } catch (err) {
    console.log("admin get users error", err);
    res.status(500).json({ message: "Unable to fetch users", error: "Server side error" });
  }
});

// Toggle user active/inactive status
adminApp.put("/users/:id/status", verifyToken("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { isUserActive } = req.body;

    if (typeof isUserActive !== "boolean") {
      return res.status(400).json({ message: "Invalid payload", error: "isUserActive must be boolean" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { isUserActive },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User status updated", payload: updatedUser });
  } catch (err) {
    console.log("admin update user status error", err);
    res.status(500).json({ message: "Unable to update user", error: "Server side error" });
  }
});

// Get all articles for moderation
adminApp.get("/articles", verifyToken("ADMIN"), async (req, res) => {
  try {
    const articles = await ArticleModel.find()
      .populate("author", "firstName lastName email role profileImageUrl")
      .lean();

    res.status(200).json({ message: "Articles fetched successfully", payload: articles });
  } catch (err) {
    console.log("admin get articles error", err);
    res.status(500).json({ message: "Unable to fetch articles", error: "Server side error" });
  }
});

// Change article active/inactive status
adminApp.put("/articles/:id/status", verifyToken("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { isArticleActive } = req.body;

    if (typeof isArticleActive !== "boolean") {
      return res.status(400).json({ message: "Invalid payload", error: "isArticleActive must be boolean" });
    }

    const updatedArticle = await ArticleModel.findByIdAndUpdate(
      id,
      { isArticleActive },
      { new: true, runValidators: true },
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article status updated", payload: updatedArticle });
  } catch (err) {
    console.log("admin update article status error", err);
    res.status(500).json({ message: "Unable to update article", error: "Server side error" });
  }
});

// Delete an article permanently
adminApp.delete("/articles/:id", verifyToken("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedArticle = await ArticleModel.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article deleted successfully", payload: deletedArticle });
  } catch (err) {
    console.log("admin delete article error", err);
    res.status(500).json({ message: "Unable to delete article", error: "Server side error" });
  }
});

// Get admin dashboard metrics
adminApp.get("/stats", verifyToken("ADMIN"), async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isUserActive: true });
    const totalAuthors = await UserModel.countDocuments({ role: "AUTHOR" });
    const totalAdmins = await UserModel.countDocuments({ role: "ADMIN" });
    const totalArticles = await ArticleModel.countDocuments();
    const activeArticles = await ArticleModel.countDocuments({ isArticleActive: true });

    res.status(200).json({
      message: "Admin stats fetched successfully",
      payload: {
        totalUsers,
        activeUsers,
        totalAuthors,
        totalAdmins,
        totalArticles,
        activeArticles,
      },
    });
  } catch (err) {
    console.log("admin stats error", err);
    res.status(500).json({ message: "Unable to fetch stats", error: "Server side error" });
  }
});