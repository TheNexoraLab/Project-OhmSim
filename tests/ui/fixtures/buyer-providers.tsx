import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { BomProvider, useBom } from "@/hooks/use-bom";
import { BomChooserPopover } from "@/components/buyer/bom-chooser-popover";
import { ToastContainer } from "@/components/ui/toast";

function Harness() {
  const cart = useCart();
  const bom = useBom();
  const [results, setResults] = useState<boolean[]>([]);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  // Deliberate runtime misuse by a JS caller, not an accepted production API.
  const forged = { id: "6", stock: 999, name: "Forged" } as unknown as string;
  return <>
    <button id="queued" onClick={() => {
      cart.clearCart(); setResults([cart.addToCart("6"), cart.addToCart("6")]);
    }}>Queued additions</button>
    <button id="mixed" onClick={() => {
      cart.clearCart(); setResults([cart.setCartQty("6", 7), cart.addToCart("6")]);
    }}>Mixed updates</button>
    <button id="limit" onClick={() => setResults([cart.addToCart("6")])}>Overstock</button>
    <button id="capped" onClick={() => setResults([cart.setCartQty("6", 99)])}>Capped quantity</button>
    <button id="invalid" onClick={() => setResults([
      cart.addToCart("6", 0), cart.addToCart("6", -1), cart.addToCart("6", 1.5),
      cart.addToCart("6", NaN), cart.addToCart("6", Infinity),
      cart.addToCart("not-in-catalog"), cart.setCartQty("not-in-catalog", 2),
      cart.addToCart(null as unknown as string), cart.addToCart(""),
      cart.setCartQty("6", -1), cart.setCartQty("6", 1.5),
    ])}>Invalid inputs</button>
    <button id="forged" onClick={() => {
      cart.clearCart(); setResults([
        cart.addToCart(forged, 99), cart.setCartQty(forged, 99), cart.canAddToCart(forged),
        cart.addToCart({id: "not-in-catalog", stock: 999} as unknown as string),
      ]);
    }}>Caller stock override</button>
    <button id="zero" onClick={() => {
      cart.clearCart(); setResults([
        cart.addToCart("stock-zero-test"), cart.setCartQty("stock-zero-test", 1),
        cart.canAddToCart("stock-zero-test"),
      ]);
    }}>Unavailable service fixture</button>
    <button id="remove-zero" onClick={() => {
      cart.clearCart(); cart.addToCart(" 6 ", 2); setResults([cart.setCartQty("6", 0)]);
    }}>Zero removes item</button>
    <output id="cart-state">{JSON.stringify({
      cart: cart.cart, total: cart.cartTotal, results,
      remaining: cart.getRemainingStock("6"), canAdd: cart.canAddToCart("6"),
      forgedRemaining: cart.getRemainingStock(forged),
      zeroRemaining: cart.getRemainingStock("stock-zero-test"),
    })}</output>
    <output id="bom-state">{JSON.stringify(bom.bomProjects)}</output>
    <div id="edge-anchor" style={{position: "fixed", left: "calc(100vw - 32px)", top: 100}}>
      <button id="edge-trigger" ref={trigger} onClick={() => setOpen(v => !v)}>BOM</button>
      <BomChooserPopover isOpen={open} onClose={() => setOpen(false)}
        triggerRef={trigger} bomProjects={bom.bomProjects}
        onAddToBomProject={id => bom.addToBomProject(id, "1")}
        placement="bottom" align="left" />
    </div>
    <ToastContainer />
  </>;
}

function Mount() {
  const [mounted, setMounted] = useState(true);
  return <>
    <button id="unmount" onClick={() => setMounted(v => !v)}>Toggle provider</button>
    {mounted && <CartProvider><BomProvider><Harness /></BomProvider></CartProvider>}
  </>;
}

createRoot(document.getElementById("test-root")!).render(<Mount />);
