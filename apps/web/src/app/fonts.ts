import { Open_Sans } from "next/font/google";

export const openSans = Open_Sans({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--var-open-sans",
  style: "normal",
});

export const fonts = [openSans];
