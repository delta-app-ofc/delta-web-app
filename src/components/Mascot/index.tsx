import mascotImage from "../../assets/mascotes/gluh-happy.png";

import "./style.css";

export function Mascot() {
  return (
    <div className="mascot-container">
      <img
        className="mascot-image"
        src={mascotImage}
        alt="Mascote em formato de gota d'água"
      />
    </div>
  );
}