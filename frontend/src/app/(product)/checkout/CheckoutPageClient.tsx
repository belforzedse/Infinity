"use client";

import ShoppingCartBillForm from "@/components/ShoppingCart/‌Bill";
import { motion } from "framer-motion";
import React from "react";
import PageContainer from "@/components/layout/PageContainer";

export default function CheckoutPageClient() {
  return (
    <motion.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <PageContainer variant="wide" className="space-y-6 pb-16 pt-8">
        <ShoppingCartBillForm />
      </PageContainer>
    </motion.section>
  );
}

