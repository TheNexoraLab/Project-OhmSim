import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById, getProducts } from "@/services/catalog-service";
import { ProductDetailClient } from "./product-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    id: p.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return {
      title: "Product Not Found — OhmSim",
    };
  }

  return {
    title: `${product.name} — OhmSim`,
    description: product.about || product.label,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
