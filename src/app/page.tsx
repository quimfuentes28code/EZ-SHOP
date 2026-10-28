import Link from "next/link";
import { ArrowRight, Blocks, CalendarDays, MapPinned, ShieldCheck, Store, UsersRound } from "lucide-react";
export default function HomePage() {
  return <div className="container home">
    <div className="hero-label">UNA PLATAFORMA. MUCHOS NEGOCIOS.</div>
    <h1>Tu negocio, <span>tu manera</span> de trabajar.</h1>
    <p className="hero-copy">Un software de gestión que se adapta a tu actividad. Citas, clientes, presupuestos, proyectos, pedidos y más. Y para tus clientes, una sola cuenta donde gestionarlo todo.</p>
    <div className="hero-actions"><Link className="button primary" href="/onboarding">Configurar mi negocio <ArrowRight size={18}/></Link><Link className="button secondary" href="/cliente">Explorar experiencia cliente</Link></div>
    <div className="feature-grid">
      <article className="feature"><div className="feature-icon"><Blocks/></div><h3>Módulos por sector</h3><p>Activamos las herramientas relevantes y evitamos paneles llenos de opciones que no utilizas.</p></article>
      <article className="feature"><div className="feature-icon"><CalendarDays/></div><h3>Operaciones conectadas</h3><p>Una reserva puede vincularse a un cliente, un presupuesto y un proyecto sin duplicar información.</p></article>
      <article className="feature"><div className="feature-icon"><UsersRound/></div><h3>Clientes unificados</h3><p>Un perfil personal para consultar reservas y encargos de varios negocios, respetando su privacidad.</p></article>
    </div>
    <section className="split-section">
      <div><div className="eyebrow"><Store size={17}/> PARA EMPRESAS</div><h2>Un panel diseñado alrededor de tu actividad.</h2><p>Empieza con fotografía, peluquería, restauración o una actividad mixta. Los módulos se podrán ampliar sin migrar a otra aplicación.</p><Link className="inline-link" href="/empresa">Ver ejemplo de panel <ArrowRight size={17}/></Link></div>
      <div className="dark-panel"><div className="panel-head"><span>Resumen de tu actividad</span><span className="green-dot">● DEMO</span></div><div className="metrics"><div><strong>06</strong><small>Reservas próximas</small></div><div><strong>04</strong><small>Proyectos activos</small></div><div><strong>03</strong><small>Pendientes</small></div></div><div className="fake-chart"><span style={{height:"36%"}}/><span style={{height:"60%"}}/><span style={{height:"46%"}}/><span style={{height:"83%"}}/><span style={{height:"72%"}}/><span style={{height:"95%"}}/><span style={{height:"76%"}}/><span style={{height:"90%"}}/></div></div>
    </section>
    <section className="callout"><div className="eyebrow"><MapPinned size={17}/> VISIÓN A FUTURO</div><h2>Descubrir negocios cercanos, desde el mismo sitio.</h2><p>La cuenta de cliente y el directorio están contemplados en la arquitectura. El mapa real y las reservas online se incorporarán cuando exista una base de negocios suficiente.</p><p className="caution"><ShieldCheck size={17}/> Esta demo no tiene geolocalización, autenticación ni datos personales reales.</p></section>
  </div>;
}
