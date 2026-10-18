import { Link } from "react-router-dom";
import styles from "./styles.module.css";

export default function NotFoundPage() {
  return <main className={styles.page}>
    <h1>Página não encontrada</h1>
    <p>Este endereço não existe ou a página ainda está em desenvolvimento.</p>
    <nav aria-label="Retornar à aplicação"><Link to="/instalacoes">Ir para Instalações</Link><Link to="/">Voltar ao login</Link></nav>
  </main>;
}
