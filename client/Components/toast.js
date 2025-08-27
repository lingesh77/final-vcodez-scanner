// client/utils/toast.js
import { toast } from "react-toastify";

export const showSuccessToast = (message) => {
  toast.success(message, { autoClose: 5000 }); // dismiss after 5s
};

export const showErrorToast = (message) => {
  toast.error(message, { autoClose: 5000 });
};

export const showInfoToast = (message) => {
  toast.info(message, { autoClose: 5000 });
};
