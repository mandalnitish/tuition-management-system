export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const PAYMENT_MODES = ["Cash","UPI","Bank Transfer","Cheque"];
export const EXPENSE_CATEGORIES = ["Rent","Electricity","Internet","Stationery","Salary","Other"];

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const todayISO = () => new Date().toISOString().slice(0, 10);
