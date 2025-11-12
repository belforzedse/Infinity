"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { ENDPOINTS } from "@/constants/api";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

export default function UsersPage() {
  useFreshDataOnPageLoad();
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setDebouncedSearchQuery(query);
  }, 500);

  // Trigger debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Cancel any pending debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <ContentWrapper
      title="کاربران"
      hasFilterButton
      hasRecycleBin
      hasPagination
      apiUrl={ENDPOINTS.USER.GET_ALL}
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      filterOptions={[
        {
          id: "[user_info][FirstName]",
          title: "نام",
        },
        {
          id: "[user_info][LastName]",
          title: "نام خانوادگی",
        },
        {
          id: "[phone]",
          title: "شماره تلفن",
        },
      ]}
    >
      <div className="mb-3 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">جستجو:</label>
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو در نام، نام خانوادگی، شماره تلفن..."
              className="text-sm w-80 rounded-lg border border-neutral-300 px-3 py-1 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== debouncedSearchQuery && (
              <div className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearchQuery("");
              }}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              پاک کردن
            </button>
          )}
          {debouncedSearchQuery && (
            <span className="text-xs text-green-600">
              نتایج برای: &quot;{debouncedSearchQuery}&quot;
            </span>
          )}
        </div>
      </div>
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={(() => {
          let baseUrl = isRecycleBinOpen
            ? `${ENDPOINTS.USER.GET_ALL}?populate=*&filters[removedAt][$null]=false`
            : `${ENDPOINTS.USER.GET_ALL}?populate=*&filters[removedAt][$null]=true`;

          // Add search filter
          if (debouncedSearchQuery.trim()) {
            const searchTerm = debouncedSearchQuery.trim();
            const searchWords = searchTerm.split(/\s+/); // Split by any whitespace

            if (searchWords.length === 1) {
              // Single word search - search in all fields
              const encodedTerm = encodeURIComponent(searchTerm);
              baseUrl += `&filters[$or][0][user_info][FirstName][$containsi]=${encodedTerm}`;
              baseUrl += `&filters[$or][1][user_info][LastName][$containsi]=${encodedTerm}`;
              baseUrl += `&filters[$or][2][phone][$containsi]=${encodedTerm}`;
            } else if (searchWords.length === 2) {
              // Two words: prioritize FirstName + LastName in exact order
              let orIndex = 0;
              const firstName = encodeURIComponent(searchWords[0]);
              const lastName = encodeURIComponent(searchWords[1]);

              // Priority 1: First word in FirstName AND second word in LastName (exact order)
              baseUrl += `&filters[$or][${orIndex++}][$and][0][user_info][FirstName][$containsi]=${firstName}`;
              baseUrl += `&filters[$or][${orIndex-1}][$and][1][user_info][LastName][$containsi]=${lastName}`;

              // Priority 2: Exact phrase in FirstName (in case someone has compound first name)
              const encodedPhrase = encodeURIComponent(searchTerm);
              baseUrl += `&filters[$or][${orIndex++}][user_info][FirstName][$containsi]=${encodedPhrase}`;

              // Priority 3: Phone number search
              baseUrl += `&filters[$or][${orIndex++}][phone][$containsi]=${encodedPhrase}`;
            } else if (searchWords.length === 3) {
              // Three words: handle patterns like "داریوش فیضی پور"
              let orIndex = 0;
              const word1 = encodeURIComponent(searchWords[0]);
              const word3 = encodeURIComponent(searchWords[2]);

              // Priority 1: First word in FirstName AND (second + third) words in LastName
              const lastNameCombined = encodeURIComponent(searchWords.slice(1).join(' '));
              baseUrl += `&filters[$or][${orIndex++}][$and][0][user_info][FirstName][$containsi]=${word1}`;
              baseUrl += `&filters[$or][${orIndex-1}][$and][1][user_info][LastName][$containsi]=${lastNameCombined}`;

              // Priority 2: (First + second) words in FirstName AND third word in LastName
              const firstNameCombined = encodeURIComponent(searchWords.slice(0, 2).join(' '));
              baseUrl += `&filters[$or][${orIndex++}][$and][0][user_info][FirstName][$containsi]=${firstNameCombined}`;
              baseUrl += `&filters[$or][${orIndex-1}][$and][1][user_info][LastName][$containsi]=${word3}`;

              // Priority 3: Exact phrase in FirstName
              const encodedPhrase = encodeURIComponent(searchTerm);
              baseUrl += `&filters[$or][${orIndex++}][user_info][FirstName][$containsi]=${encodedPhrase}`;

              // Priority 4: Phone number search
              baseUrl += `&filters[$or][${orIndex++}][phone][$containsi]=${encodedPhrase}`;
            } else {
              // More than 3 words: try different combinations
              let orIndex = 0;
              const encodedPhrase = encodeURIComponent(searchTerm);

              // Priority 1: Exact phrase in FirstName
              baseUrl += `&filters[$or][${orIndex++}][user_info][FirstName][$containsi]=${encodedPhrase}`;

              // Priority 2: First word in FirstName, rest in LastName
              const firstName = encodeURIComponent(searchWords[0]);
              const lastName = encodeURIComponent(searchWords.slice(1).join(' '));
              baseUrl += `&filters[$or][${orIndex++}][$and][0][user_info][FirstName][$containsi]=${firstName}`;
              baseUrl += `&filters[$or][${orIndex-1}][$and][1][user_info][LastName][$containsi]=${lastName}`;

              // Priority 3: First half in FirstName, second half in LastName
              const midPoint = Math.ceil(searchWords.length / 2);
              const firstHalf = encodeURIComponent(searchWords.slice(0, midPoint).join(' '));
              const secondHalf = encodeURIComponent(searchWords.slice(midPoint).join(' '));
              baseUrl += `&filters[$or][${orIndex++}][$and][0][user_info][FirstName][$containsi]=${firstHalf}`;
              baseUrl += `&filters[$or][${orIndex-1}][$and][1][user_info][LastName][$containsi]=${secondHalf}`;

              // Priority 4: Phone number search
              baseUrl += `&filters[$or][${orIndex++}][phone][$containsi]=${encodedPhrase}`;
            }
          }

          return baseUrl;
        })()}
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
