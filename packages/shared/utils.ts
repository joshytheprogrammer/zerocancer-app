export const utility = () => {
  // This is a placeholder for shared utility functions.
  // You can add any utility functions that are used across the application here.
  console.log("Shared utility function called");
};
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
};
export const formatPhoneNumber = (phone: string): string => {
  // Simple phone number formatting (e.g., remove non-numeric characters)
  return phone.replace(/\D/g, "");
};
