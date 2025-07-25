import { checkUserExists } from "./exists";
import { sendOTP } from "./sendOTP";
import { verifyOTP } from "./verifyOTP";
import { register } from "./register";
import { loginPassword } from "./loginPassword";
import { resetPassword } from "./resetPassword";

const AuthService = {
  checkUserExists,
  sendOTP,
  verifyOTP,
  register,
  loginPassword,
  resetPassword,
};

export default AuthService;
