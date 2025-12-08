const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// only admin
const getAllUsers = async (req, res) => {
    const users = await userModel.find();
    res.json(users);
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, suspensionReason } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (isActive === false && !suspensionReason) {
            return res.status(400).json({
                message: "Suspension reason required when deactivating user",
            });
        }

        user.isActive = isActive;
        user.suspensionReason = isActive ? "" : suspensionReason;
        await user.save();

        // if (isActive === false) {
        //     try {
        //         await sendEmail(
        //             user.email,
        //             "Account Deactivated - ForstKontroll",
        //             `Dear ${user.email},\n\nYour account has been deactivated by the admin.\nReason: ${suspensionReason}\n\nIf you believe this was a mistake, please contact support.\n\n— ForstKontroll Team`
        //         );
        //         console.log(`Suspension email sent to ${user.email}`);
        //     } catch (emailError) {
        //         console.error("Error sending suspension email:", emailError);
        //     }
        // }

        // ✅ Send response

        try {
            const statusText = isActive ? "Activated" : "Deactivated";
            const messageBody = isActive
                ? `
                    <p>Hello <b>${user.name || user.email}</b>,</p>
                    <p>We’re pleased to inform you that your account has been <b>re-activated</b> and is now accessible again.</p>
                    <p>If you did not request this or believe it is a mistake, please <a href="mailto:support@frostkontroll.com">contact support</a>.</p>
                `
                : `
                    <p>Hello <b>${user.name || user.email}</b>,</p>
                    <p>Your account has been <b>deactivated</b> by the admin.</p>
                    <p><b>Reason:</b> ${suspensionReason}</p>
                    <p>If you believe this action was taken in error, please <a href="mailto:support@frostkontroll.com">contact support</a> as soon as possible.</p>
                `;

            await sendEmail(
                user.email,
                `Account ${statusText} - FrostKontroll`,
                `
                <div style="font-family: Arial, sans-serif; color: #333; background: #f5f8fa; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center;">
                        <img src="cid:companyLogo" alt="FrostKontroll Logo" style="width: 120px; margin-bottom: 20px;" />
                    </div>
                    <h2 style="color: #0055a5;">Account ${statusText}</h2>
                    ${messageBody}
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888; text-align: center;">
                        &copy; ${new Date().getFullYear()} FrostKontroll. All rights reserved.<br/>
                        <a href="mailto:support@frostkontroll.com" style="color: #0055a5; text-decoration: none;">Contact Support</a>
                    </p>
                </div>
                `
            );
            console.log(`Email sent to ${user.email} for account status change.`);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
        }
        
        res.status(200).json({
            message: `User has been ${isActive ? "activated" : "deactivated"}`,
            user,
        });
    } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).json({ message: "Error updating user status" });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, organization } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Update name if provided
        if (name) user.name = name;

        // ✅ Update email if provided and not already in use
        if (email && email !== user.email) {
            const emailExists = await userModel.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        // ✅ Update organization if provided
        if (organization) {
            user.organization = organization;
        }

        // ✅ Update password if provided
        if (password) {
            // const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, 10);
        }

        // ✅ Save the user
        await user.save();

        res.status(200).json({
            message: "User updated successfully",
            user,
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Error updating user" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await userModel.findByIdAndDelete(id);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Error deleting user" });
    }
};


module.exports = { getAllUsers, updateUserStatus, updateUserProfile, deleteUser }