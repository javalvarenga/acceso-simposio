
import Swal from "sweetalert2";

export function sweetAlert(
  title: string,
  text: string,
  icon: 'success' | 'error' | 'info',
  timer: number = 2000
) {
  Swal.fire({
    title,
    text,
    icon,
    toast: true,
    position: 'top-end',
    timer: timer,
    showConfirmButton: false,
  });
}