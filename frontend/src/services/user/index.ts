import { me } from "./me";
import { getAll } from "./getAll";
import { getDetails } from "./getDetails";
import { getInfo } from "./getInfo";
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "./addresses";

const UserService = {
  me,
  getAll,
  getDetails,
  getInfo,
  addresses: {
    getAll: getUserAddresses,
    add: addUserAddress,
    update: updateUserAddress,
    delete: deleteUserAddress,
  },
};

export default UserService;
