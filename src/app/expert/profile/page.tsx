import type { Metadata } from "next";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = { title: "내 자격·프로필" };

export default function ExpertProfilePage() {
  return <ProfileView />;
}
