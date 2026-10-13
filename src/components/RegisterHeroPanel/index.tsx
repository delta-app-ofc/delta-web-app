import mascotRegister from "../../assets/mascotes/gluh-animarion.png";

import "./style.css";

export function RegisterHeroPanel() {
  return (
    <aside className="register-hero">
      <div className="register-hero__headline">
        <p className="register-hero__subtitle">
          Transformando hábitos
        </p>

        <div className="register-hero__brand">
          <span className="register-hero__gota">
            gota
          </span>

          <div className="register-hero__second-line">
            <span className="register-hero__por">
              por
            </span>

            <span className="register-hero__gota">
              gota.
            </span>
          </div>
        </div>
      </div>

      <div className="register-hero__mascot-container">
        <img
          src={mascotRegister}
          alt="Mascote em formato de gota d'água"
          className="register-hero__mascot"
        />
      </div>
    </aside>
  );
}