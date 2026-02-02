import logo from "/public/images/cropped-021.webp";
import Image from "next/image";
const ContactHeader = () => {
  return (
    <div className="mb-9 flex flex-col text-center">
      <Image
        src="/images/cropped-021.webp"
        alt="HeaderLogo"
        className="mx-auto mb-4 h-[68px] w-[110px]"
        width={100}
        height={100}
      />
      <p className="font-[Peyda(FaNum)] text-4xl/[100%] font-normal text-neutral-800">
        مشتاق دیدن شماییم!
      </p>
    </div>
  );
};

export default ContactHeader;
