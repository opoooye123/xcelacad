const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");
const { isAdminEmail } = require("../utils/isAdminEmail");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(null, false);
        }

        const avatar =
          profile.photos?.[0]?.value || "";

        let user = await User.findOne({ email });

        // Emails listed in ADMIN_EMAILS become admins
        const shouldBeAdmin = isAdminEmail(email);

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            authProvider: "google",
            avatar,
            role: shouldBeAdmin ? "admin" : "student",
            lastLoginAt: new Date(),
          });
        } else {
          // A suspended account must not receive a token
          if (user.isBlocked) {
            return done(null, false);
          }

          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
          }

          // Promote an existing account if it was
          // added to ADMIN_EMAILS after signing up
          if (shouldBeAdmin && user.role !== "admin") {
            user.role = "admin";
          }

          if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
          }

          user.lastLoginAt = new Date();

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Google authentication error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;