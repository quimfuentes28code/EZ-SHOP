"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Crown,
  HardDrive,
  Layers3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "@/components/modal";
import {
  FEATURE_CATALOG,
  getFeatureAccess,
  type FeatureId,
} from "@/lib/access";
import "./plan.css";

export default function PlanPage() {
  const [details, setDetails] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [preview, setPreview] = useState(false);
  const features = Object.entries(FEATURE_CATALOG).filter(
    ([, feature]) => feature.status === "preview",
  ) as [FeatureId, (typeof FEATURE_CATALOG)[FeatureId]][];
  return (
    <div className="container plan-page">
      <Link href="/demo/empresa" className="inline-link">
        <ArrowLeft size={15} />
        Volver a mi negocio
      </Link>
      <div className="plan-heading">
        <span className="eyebrow">AUTONOSERVICE · TU NEGOCIO. MÁS FÁCIL.</span>
        <h1>Mi plan</h1>
        <p>Empieza con lo esencial. Amplía tu gestión cuando lo necesites.</p>
      </div>
      <div className="plan-grid">
        <section className="plan-card">
          <div className="plan-card-top">
            <span className="plan-symbol">
              <Layers3 size={25} />
            </span>
            <span className="tag">Plan de muestra actual</span>
          </div>
          <h2>AutonoService</h2>
          <span className="plan-price">Gratis</span>
          <p>Herramientas útiles para el día a día de un pequeño negocio.</p>
          <ul>
            <li>
              <Check size={15} />
              Clientes y agenda básica
            </li>
            <li>
              <Check size={15} />
              Seguimiento sencillo de trabajos
            </li>
            <li>
              <Check size={15} />
              Presupuestos básicos con límites por definir
            </li>
            <li>
              <Check size={15} />
              Herramientas según tu actividad
            </li>
            <li>
              <Check size={15} />
              Perfil del negocio cuando se lance el directorio
            </li>
          </ul>
          <div className="plan-current">
            <CheckCircle2 size={16} />
            Sin caducidad de prueba prevista
          </div>
          <small>
            En este Hito 0 se revisan prototipos, no un servicio comercial
            activo. Los límites gratuitos se definirán antes del lanzamiento.
          </small>
        </section>
        <section className="plan-card suite-card">
          <div className="plan-card-top">
            <span className="plan-symbol">
              <Crown size={26} />
            </span>
            <span className="suite-pill">MEJORA PROFESIONAL</span>
          </div>
          <span className="eyebrow">TODO EL POTENCIAL DE TU NEGOCIO.</span>
          <h2>Desbloquea AutonoSuite</h2>
          <p>Lleva la gestión de tu negocio al siguiente nivel.</p>
          <div className="plan-price">
            99 €<span>pago único · precio provisional</span>
          </div>
          <ul>
            <li>
              <Check size={15} />
              Gestión avanzada de clientes
            </li>
            <li>
              <Check size={15} />
              Proyectos: Kanban, tabla y calendario
            </li>
            <li>
              <Check size={15} />
              Presupuestos y calculadoras personalizables
            </li>
            <li>
              <Check size={15} />
              Plantillas, estadísticas y productividad
            </li>
            <li>
              <Check size={15} />
              Funciones de la versión adquirida
            </li>
          </ul>
          <button className="button primary" onClick={() => setUpgrade(true)}>
            Mejorar a AutonoSuite — 99 € <ArrowRight size={16} />
          </button>
          <strong className="suite-payment-note">
            Un único pago. Sin suscripción obligatoria.
          </strong>
          <small>
            Diseño de la mejora. Todavía no se puede comprar ni se activa una
            licencia real.
          </small>
        </section>
      </div>
      <section className="plan-rules">
        <article>
          <HardDrive size={22} />
          <h3>Las funciones adquiridas, contigo.</h3>
          <p>
            La licencia perpetua se aplicará a las funciones locales de la
            versión adquirida. Una nueva versión mayor será opcional; el ejemplo
            previsto es una actualización de 39 €.
          </p>
        </article>
        <article>
          <Cloud size={22} />
          <h3>Lo online tiene su propio coste.</h3>
          <p>
            Sincronización, almacenamiento remoto, reservas públicas e IA pueden
            necesitar servicios independientes. No se promete infraestructura
            ilimitada.
          </p>
        </article>
        <article>
          <ShieldCheck size={22} />
          <h3>Una app. Una misma cuenta.</h3>
          <p>
            AutonoSuite es una mejora profesional de AutonoService. La
            experiencia Cliente sigue siendo completamente gratuita.
          </p>
        </article>
      </section>
      <section className="plan-permissions">
        <div>
          <h2>Qué permite cada nivel</h2>
          <p>
            Vista previa de permisos por contexto, rol, módulo y versión. Los
            permisos reales se validarán en servidor.
          </p>
        </div>
        <button
          className="button secondary small"
          aria-expanded={details}
          onClick={() => setDetails(!details)}
        >
          {details ? "Ocultar comparación" : "Comparar funcionalidades"}
        </button>
        {details && (
          <div className="plan-comparison">
            <label className="plan-preview-switch">
              <input
                type="checkbox"
                checked={preview}
                onChange={(event) => setPreview(event.target.checked)}
              />
              Simular permisos de AutonoSuite 1.0 (no activa una licencia)
            </label>
            <ul>
              {features.map(([id, feature]) => {
                const decision = getFeatureAccess(
                  {
                    experience: "business",
                    role: "owner",
                    plan: preview ? "suite" : "free",
                    licenseVersion: 1,
                    moduleEnabled: true,
                    platform: "web",
                    licensePlatform: "web",
                  },
                  id,
                );
                return (
                  <li key={id}>
                    <span>
                      {feature.label}
                      <small>Prototipo</small>
                    </span>
                    <span>
                      {decision.allowed ? (
                        <>
                          <Check size={14} />
                          Incluido en {preview ? "la simulación" : "Gratis"}
                        </>
                      ) : (
                        <>
                          <LockKeyhole size={14} />
                          AutonoSuite
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
      <p className="plan-legal-note">
        Condiciones provisionales. La política de soporte, compatibilidad y
        actualizaciones de seguridad debe definirse antes de vender. Las compras
        y licencias se adaptarán a las reglas de cada plataforma.
      </p>
      {upgrade && (
        <Modal
          title="AutonoSuite, dentro de AutonoService"
          onClose={() => setUpgrade(false)}
        >
          <p>
            Esta pantalla permite revisar cómo será la mejora. No se ha
            realizado ningún cobro ni se ha activado una licencia.
          </p>
          <div className="notice">
            <ShieldCheck size={19} />
            <p>
              Precio provisional: 99 €. Un único pago. Sin suscripción
              obligatoria. Las condiciones y funciones incluidas se confirmarán
              antes del lanzamiento.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setUpgrade(false)}
            >
              Cerrar
            </button>
            <button
              className="button primary"
              onClick={() => {
                setUpgrade(false);
                setDetails(true);
                setPreview(true);
              }}
            >
              Ver simulación de funciones
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
