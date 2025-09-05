import { clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export  const formattedDate = (date) => {
  // Check if the date is a valid Date object or valid date string
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate)) {
    // Return a default value or error message if the date is invalid
    return "Invalid Date";
  }

  return format(parsedDate, "MMM d, yyyy, p");
};