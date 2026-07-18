"use client";
import { useState } from "react";
import { useUser } from "@/providers/User";

export function Settings() {
  const { user, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp } =
    useUser();

  return (
    <section className="w-full px-4">

    </section>
  );
}
