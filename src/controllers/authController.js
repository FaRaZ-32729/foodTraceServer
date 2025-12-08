const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const organizationModel = require("../models/organizationModel");



const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email, !password) return res.status(400).json({ message: "All Fields Are Required" });

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
            });
        };

        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User Already Exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await userModel.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true,
            isVerified: true
        });

        return res.status(201).json({ message: "Admin Created Successfully", Admin: newAdmin })
    } catch (error) {
        console.log(error.message, "error occured while creating admin");
    }
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// admin only
const adminCreateUser = async (req, res) => {
    try {
        const { name, email, role, organizationId } = req.body;

        if (!email || !role || !organizationId || !name)
            return res.status(400).json({ message: "All Fields Are Required" });

        const organization = await organizationModel.findById(organizationId);
        if (!organization)
            return res.status(404).json({ message: "Organization not found" });


        const existing = await userModel.findOne({ email });
        if (existing)
            return res.status(400).json({ message: "User with this email already exists" });


        const orgAssignedUser = await userModel.findOne({ organization: organizationId });
        if (orgAssignedUser)
            return res.status(400).json({
                message: `This organization is already assigned to: ${orgAssignedUser.email}`,
            });


        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const user = await userModel.create({
            name,
            email,
            role,
            organization: organization._id,
            setupToken: token,
            isActive: false,
            isVerified: false,
        });

        const setupLink = `http://localhost:5173/setup-password/${token}`;

        // await sendEmail(
        //     email,
        //     "Set up your FrostKontrol account",
        //     `Hello,\n\nYour account has been created by admin.\nPlease click the link below to set your password:\n\n${setupLink}\n\nThis link will expire in 24 hours.`
        // );

        // Example in controller
        await sendEmail(
            user.email,
            "Set up your FrostKontroll account",
            `
    <div style="font-family: Arial, sans-serif; color: #333; background: #f5f8fa; padding: 20px; border-radius: 8px;">
        <div style="text-align: center;">
            <img src="cid:companyLogo" alt="FrostKontroll Logo" style="width: 120px; margin-bottom: 20px;" />
        </div>
        <h2 style="color: #0055a5;">Welcome to FrostKontroll!</h2>
        <p>Hello <b>${user.name || user.email}</b>,</p>
        <p>Your account has been created by the admin. Please click the button below to set up your password and activate your account:</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="${setupLink}"
               style="background-color: #0055a5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 16px;">
               Set Password
            </a>
        </div>
        
        <p style="font-size: 14px; color: #555;">
            This link will expire in 24 hours. If you didn't expect this email, please ignore it.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #888; text-align: center;">
            &copy; ${new Date().getFullYear()} FrostKontroll. All rights reserved.<br/>
            <a href="mailto:support@frostkontroll.com" style="color: #0055a5; text-decoration: none;">Contact Support</a>
        </p>
    </div>
    `
        );


        // const populatedUser = await userModel.populate("organization", "name");
        const populatedUser = await userModel.findById(user._id).populate("organization", "name");

        res.status(201).json({ message: "User created and setup link sent", user: populatedUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating user" });
    }
};

const setPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password)
            return res.status(400).json({ message: "Password is required" });

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
            });
        };

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email, setupToken: token });
        if (!user)
            return res.status(404).json({ message: "Invalid or expired link" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min validity

        user.password = hashedPassword;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();


        await sendEmail(
            user.email,
            "Verify Your FrostKontrol Account",
            `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e6e6e6; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e6e6e6;">
          <img src="https://i.ibb.co/2Mdp9p0/frostKontrol.png" alt="FrostKontrol Logo" style="max-width: 180px;" />
      </div>

      <h2 style="color: #263238; margin-top: 30px;">Welcome to FrostKontrol!</h2>
      <p style="font-size: 14px; line-height: 1.6;">
          Hi <strong>${user.name || user.email}</strong>,
          <br><br>
          Your password has been successfully set. To complete your account setup, please use the one-time password (OTP) below to verify your email address.
      </p>

      <div style="background-color: #f4faff; border: 1px solid #cde7ff; padding: 15px; margin: 20px 0; text-align: center; font-size: 22px; letter-spacing: 3px; font-weight: bold;">
          ${otp}
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
          This OTP is valid for the next <strong>10 minutes</strong>. If you didn’t request this, please ignore this email.
      </p>

      <p style="font-size: 14px; line-height: 1.6;">
          Best Regards, <br>
          <strong>FrostKontrol Team</strong>
      </p>

      <div style="text-align: center; font-size: 12px; color: #777; margin-top: 30px;">
          © ${new Date().getFullYear()} FrostKontrol, All rights reserved.
          <br>
          This is an automated message, please do not reply.
      </div>
  </div>
  `
        );


        res.json({ message: "Password set successfully, OTP sent to email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error setting password" });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const { token } = req.params;

        if (!otp || !token)
            return res.status(400).json({ message: "OTP and token are required" });

        // 🔹 Decode token to get email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) return res.status(404).json({ message: "User not found" });

        // 🔹 Validate OTP
        if (user.otp !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        if (Date.now() > user.otpExpiry)
            return res.status(400).json({ message: "OTP expired" });

        // 🔹 Update user status
        user.isVerified = true;
        user.isActive = true;
        user.otp = null;
        user.otpExpiry = null;
        user.setupToken = null;

        await user.save();

        return res.json({
            message: "Account verified successfully. You can now log in.",
        });
    } catch (err) {
        console.error("OTP Verification Error:", err);
        if (err.name === "TokenExpiredError") {
            return res.status(400).json({ message: "Verification link expired" });
        }
        return res.status(500).json({ message: "Error verifying OTP" });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        if (!user.isActive)
            return res.status(403).json({
                message: user.suspensionReason || "Account suspended by admin",
            });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { password: _, ...userData } = user.toObject();

        res.status(200).json({
            message: "Login successful",
            user: userData,
            token,
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Login error" });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        // Generate reset token (expires in 15 minutes)
        const resetToken = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Create reset link
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        // Send email
        await sendEmail(
            user.email,
            "Reset Your FrostKontroll Password",
            `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Hello <b>${user.name || user.email}</b>,</p>
                <p>We received a request to reset your password. Click the link below to set a new password. 
                This link will expire in <b>15 minutes</b>.</p>

                <div style="margin: 20px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #0055a5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       Reset Password
                    </a>
                </div>

                <p>If you didn’t request this, please ignore this email.</p>
                <hr/>
                <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} FrostKontroll. All rights reserved.</p>
            </div>
            `
        );

        // Optionally store token (to invalidate later if needed)
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        res.status(200).json({
            message: "Password reset link sent to your email",
        });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Error sending reset email" });
    }
};


const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password)
            return res.status(400).json({ message: "Token and new password are required" });

        // Validate new password
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findOne({
            email: decoded.email,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() } // ensure token not expired
        });

        if (!user)
            return res.status(400).json({ message: "Invalid or expired reset link" });

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        if (err.name === "TokenExpiredError")
            return res.status(400).json({ message: "Reset link expired" });

        res.status(500).json({ message: "Error resetting password" });
    }
};


const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", secure: false });
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ success: false, message: "Logout failed" });
    }
};

const verifyMe = async (req, res) => {
    console.log("verify");
    try {
        res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        console.error("Error While Verifing User", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports = { adminCreateUser, setPassword, verifyOTP, loginUser, registerAdmin, verifyMe, resetPassword, forgotPassword, logoutUser }