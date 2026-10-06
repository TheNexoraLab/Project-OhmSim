import type { Metadata } from "next";
import { AuthExperience } from "./auth-experience";

export const metadata: Metadata = {
  title: "Sign In — OhmSim",
  description: "OhmSim authentication UI preview. Backend authentication is not connected.",
};

export default function LoginPage() {
  return <AuthExperience />;
}
