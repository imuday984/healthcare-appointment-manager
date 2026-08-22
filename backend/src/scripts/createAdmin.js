const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

const ADMIN_EMAIL = "admin@healthcare.com";
const ADMIN_PASSWORD = "Admin@12345";
const ADMIN_NAME = "System Administrator";

async function createAdmin() {
    try {
        const existingAdmin = await prisma.user.findUnique({
            where: {
                email: ADMIN_EMAIL
            }
        });

        if (existingAdmin) {
            console.log("Admin account already exists.");
            console.log(`Email: ${ADMIN_EMAIL}`);
            return;
        }

        const hashedPassword = await bcrypt.hash(
            ADMIN_PASSWORD,
            12
        );

        const admin = await prisma.user.create({
            data: {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: "ADMIN",
                accountStatus: "ACTIVE"
            }
        });

        console.log("");
        console.log("=================================");
        console.log("ADMIN CREATED SUCCESSFULLY");
        console.log("=================================");
        console.log(`Email:    ${admin.email}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log(`Role:     ${admin.role}`);
        console.log(`Status:   ${admin.accountStatus}`);
        console.log("=================================");
        console.log("");

    } catch (error) {
        console.error("Failed to create admin:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();