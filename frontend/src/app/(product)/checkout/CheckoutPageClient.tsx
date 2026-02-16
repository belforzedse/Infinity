"use client";

import ShoppingCartBillForm from "@/components/ShoppingCart/Bill";
import React from "react";
import PageContainer from "@/components/layout/PageContainer";

export default function CheckoutPageClient() {
  return (
    <section>
      <PageContainer variant="wide" className="space-y-6 pb-16 pt-8">
        <ShoppingCartBillForm />
      </PageContainer>
    </section>
  );
}

