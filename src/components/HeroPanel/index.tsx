import { BrandHeadline } from "../BrandHeadLine";
import { Mascot } from "../Mascot";

import "./style.css";

export function HeroPanel() {
  return (
    <aside className="hero-panel">
      <BrandHeadline />

      <Mascot />
    </aside>
  );
}