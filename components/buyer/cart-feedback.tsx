"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./cart-feedback.module.css";

type CartTarget = "desktop" | "mobile";
interface Flight {
  id: number;
  image: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}
interface CartFeedback {
  flyToCart: (source: HTMLElement, image: string) => void;
  bounces: Partial<Record<CartTarget, number>>;
  finishBounce: (target: CartTarget, id: number) => void;
}

const CartFeedbackContext = createContext<CartFeedback | null>(null);
export function useCartFeedback() {
  const feedback = useContext(CartFeedbackContext);
  if (!feedback) throw new Error("Cart feedback requires the Buyer feedback provider");
  return feedback;
}

// Visual feedback only: no cart mutation, success claims, navigation or focus changes.
export function CartFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bounces, setBounces] = useState<CartFeedback["bounces"]>({});
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancelMotion = () => {
      if (!preference.matches) return;
      pending.forEach(clearTimeout);
      pending.clear();
      setFlights([]);
      setBounces({});
    };
    preference.addEventListener("change", cancelMotion);
    return () => {
      preference.removeEventListener("change", cancelMotion);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const flyToCart = useCallback((sourceElement: HTMLElement, image: string) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Both shells exist in the DOM. Never fly to the hidden desktop/mobile icon.
    const target = [...document.querySelectorAll<HTMLElement>("[data-cart-icon]")].find(icon => {
      const rect = icon.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0
        && rect.left < innerWidth && rect.right > 0;
    });
    if (!target) return;
    const targetName = target.dataset.cartIcon as CartTarget;
    const destination = target.getBoundingClientRect();
    const source = sourceElement.getBoundingClientRect();
    // Reuse the displayed thumbnail's cached URL so a 650ms flight needn't
    // wait for another remote image/optimization request. Details uses its hero.
    const thumbnail = sourceElement.closest("[data-cart-source]")?.querySelector<HTMLImageElement>("img");
    const flightImage = thumbnail?.complete && thumbnail.naturalWidth > 0 ? thumbnail.currentSrc : image;
    const id = ++nextId.current;
    const x = source.left + source.width / 2;
    const y = source.top + source.height / 2;
    setFlights(current => [...current.slice(-5), {
      id, image: flightImage, x, y,
      dx: destination.left + destination.width / 2 - x,
      dy: destination.top + destination.height / 2 - y,
    }]);
    // The cart has already updated. The bounce acknowledges the visual arrival.
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setFlights(current => current.filter(flight => flight.id !== id));
      if (target.isConnected && target.getBoundingClientRect().width > 0) {
        setBounces(current => ({ ...current, [targetName]: id }));
      }
    }, 650);
    timers.current.add(timer);
  }, []);

  const finishBounce = useCallback((target: CartTarget, id: number) => {
    setBounces(current => current[target] === id ? { ...current, [target]: undefined } : current);
  }, []);

  return <CartFeedbackContext.Provider value={{ flyToCart, bounces, finishBounce }}>
    {children}
    {flights.length > 0 && createPortal(
      <div className={styles.overlay} data-cart-flight-overlay aria-hidden="true">
        {flights.map(flight => <div key={flight.id} className={styles.flight}
          data-cart-flight={flight.id}
          style={{ left: flight.x - 20, top: flight.y - 20,
            "--fly-x": `${flight.dx}px`, "--fly-y": `${flight.dy}px` } as React.CSSProperties}>
          <Image src={flight.image} alt="" width={40} height={40} unoptimized className={styles.thumbnail} />
        </div>)}
      </div>, document.body)}
  </CartFeedbackContext.Provider>;
}

export function CartFeedbackIcon({ target, children }: {
  target: CartTarget; children: React.ReactNode;
}) {
  const { bounces, finishBounce } = useCartFeedback();
  const id = bounces[target];
  return <span data-cart-icon={target} className={styles.icon}>
    <span key={id ?? "rest"} data-cart-bounce={id ? target : undefined}
      className={id ? styles.bounce : styles.icon}
      onAnimationEnd={() => { if (id) finishBounce(target, id); }}>
      {children}
    </span>
  </span>;
}
