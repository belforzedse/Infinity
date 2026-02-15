const path = "frontend/src/components/ShoppingCart/\u206CBill/PaymentGateway.tsx";
const { execSync } = require("child_process");
execSync(`git rm "${path.replace(/"/g, '\\"')}"`, { stdio: "inherit", cwd: require("path").resolve(__dirname, "..") });
