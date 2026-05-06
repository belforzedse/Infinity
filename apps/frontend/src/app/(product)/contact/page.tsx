import React from "react";
import Illustration from "@/components/Contact/Illustration";
import ContactUs from "@/components/Contact/ContactUs";
import ContactHeader from "@/components/Contact/ContactHeader";

const page = () => {
  return (
    <div className="mb-[122px] mt-20 flex flex-row-reverse items-center justify-center px-5 py-6 max-md:flex max-md:flex-col-reverse max-md:items-center max-md:justify-center ">
      <Illustration />
      <div className="ml-[77px] flex flex-col rounded-[20px] bg-stone-50 p-4 max-md:mx-auto max-md:mb-5">
        <ContactHeader />
        <div className="flex flex-col">
          <div className="flex gap-3 max-md:flex max-md:flex-col">
            <div className="rounded-xl bg-white p-4">
              <p className="mb-3 font-[Peyda(FaNum)] text-xl/[27.8px] text-neutral-900">
                مراجعه حضوری
              </p>
              <p className="font-[Peyda(FaNum)] text-sm/[26.6px] text-neutral-500">
                گرگان، بلوار ناهارخوران نبش عدالت 68، گنبد کاووس، ابتدای بلوار دانشجو
              </p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="mb-3 font-[Peyda(FaNum)] text-xl/[27.8px] text-neutral-900">
                پشتیبانی مشتریان
              </p>
              <p className="font-[Peyda(FaNum)] text-sm/[26.6px] text-neutral-500">
                شنبه تا پنج شنبه (غیر از روزهای تعطیل) از ساعت9 صبح الی 17 پاسخگوی شما هستیم.
              </p>
            </div>
          </div>
          <ContactUs />
        </div>
      </div>
    </div>
  );
};

export default page;
