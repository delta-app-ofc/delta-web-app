import "./style.css";

export function BrandHeadline() {
  return (
    <div className="brand-headline">
      <p className="brand-headline__subtitle">
        Transformando hábitos
      </p>

      <div className="brand-headline__main">
        <span className="brand-headline__gota">
          gota
        </span>

        <div className="brand-headline__second-line">
          <span className="brand-headline__por">
            por
          </span>

          <span className="brand-headline__gota">
            gota.
          </span>
        </div>
      </div>
    </div>
  );
}