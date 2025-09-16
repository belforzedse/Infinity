"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import ShippingTabs from "@/components/SuperAdmin/ShippingTabs";
import SuperAdminTableSelect from "@/components/SuperAdmin/Table/Select";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Province } from "../../table";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

export default function ShippingCitiesPage() {
  const { id } = useParams();

  const [provinces, setProvinces] = useState<Province[]>([]);

  const router = useRouter();

  useEffect(() => {
    apiClient
      .get(`/shipping-provinces?pagination[page]=1&pagination[pageSize]=100`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      })
      .then((res) => {
        setProvinces((res as any).data as Province[]);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ShippingTabs selectedTab="city" />

      <ContentWrapper
        title="لیست شهرها"
        hasFilterButton
        hasPagination
        filterOptions={[
          {
            id: "[Title]",
            title: "عنوان",
          },
        ]}
        titleSuffixComponent={
          <SuperAdminTableSelect
            onOptionSelect={(option) => {
              router.push(`/super-admin/shipping/provinces/${option}/cities`);
            }}
            selectedOption={id as string}
            options={provinces.map((province) => ({
              id: province.id,
              title: province.attributes?.Title,
            }))}
          />
        }
      >
        <SuperAdminTable
          removeActions
          columns={columns}
          url={`/shipping-cities?filters[shipping_province][id][$eq]=${id}&populate=shipping_province`}
          mobileTable={(data) => <MobileTable data={data} />}
        />
      </ContentWrapper>
    </div>
  );
}
