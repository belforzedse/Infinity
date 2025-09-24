"use client";

import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { motion, AnimatePresence } from "framer-motion";
import SearchIcon from "@/components/Search/Icons/SearchIcon";

type User = {
  id: string;
  attributes: {
    Phone: string;
    IsActive: boolean;
    user_info: {
      data: {
        attributes: {
          FirstName: string;
          LastName: string;
        };
      };
    };
    user_role: {
      data: {
        attributes: {
          Title: string;
        };
      };
    };
    user_wallet: {
      data: {
        attributes: {
          Balance: string;
        };
      };
    };
  };
};

interface UserSearchSectionProps {
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
}

const UserSearchSection: React.FC<UserSearchSectionProps> = ({
  selectedUser,
  onUserSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced live search
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setActiveIndex(-1);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        // Use EXACT same logic as working users page
        let baseUrl = `/local-users?populate=*&filters[removedAt][$null]=true&pagination[pageSize]=6`;

        // Add search filter - EXACT copy from users page
        const searchTerm = q.trim();
        const searchWords = searchTerm.split(/\s+/); // Split by any whitespace

        if (searchWords.length === 1) {
          // Single word search - search in all fields
          const encodedTerm = encodeURIComponent(searchTerm);
          baseUrl += `&filters[$or][0][user_info][FirstName][$containsi]=${encodedTerm}`;
          baseUrl += `&filters[$or][1][user_info][LastName][$containsi]=${encodedTerm}`;
          baseUrl += `&filters[$or][2][Phone][$containsi]=${encodedTerm}`;
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
          baseUrl += `&filters[$or][${orIndex++}][Phone][$containsi]=${encodedPhrase}`;
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
          baseUrl += `&filters[$or][${orIndex++}][Phone][$containsi]=${encodedPhrase}`;
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
          baseUrl += `&filters[$or][${orIndex++}][Phone][$containsi]=${encodedPhrase}`;
        }

        console.log('User search URL:', baseUrl); // Debug log

        const response = await apiClient.get(baseUrl, {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          signal: controller.signal,
        });

        if (!mounted) return;

        console.log('User search response:', response); // Debug log
        const users = (response as any).data as User[];
        setSuggestions(users);
        setOpen(users.length > 0);
      } catch (error) {
        if (!mounted) return;
        console.error('User search error:', error); // Debug log
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const user = suggestions[activeIndex];
      if (user) {
        onUserSelect(user);
        setOpen(false);
        setSearchQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setOpen(false);
    setSearchQuery("");
  };

  const getUserDisplayName = (user: User) => {
    const firstName = user.attributes.user_info?.data?.attributes?.FirstName;
    const lastName = user.attributes.user_info?.data?.attributes?.LastName;
    return firstName && lastName ? `${firstName} ${lastName}` : user.attributes.Phone;
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('fa-IR').format(Number(price));
  };

  return (
    <div className="space-y-4">
      {/* Selected User Display */}
      {selectedUser ? (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <span className="text-sm font-semibold text-green-800">
                {getUserDisplayName(selectedUser).charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-green-900">
                {getUserDisplayName(selectedUser)}
              </p>
              <p className="text-sm text-green-700">
                {selectedUser.attributes.Phone}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-green-700">
              موجودی: {formatPrice(selectedUser.attributes.user_wallet?.data?.attributes?.Balance || "0")} تومان
            </p>
            <button
              onClick={() => onUserSelect(null as any)}
              className="mt-1 text-sm text-red-600 hover:text-red-800"
            >
              حذف
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            هیچ مشتری انتخاب نشده (اختیاری) - اطلاعات مشتری به صورت دستی وارد خواهد شد
          </p>
        </div>
      )}

      {/* Search Input */}
      <div
        ref={containerRef}
        className="relative"
      >
        <motion.div
          className={`relative flex w-full items-center justify-between rounded-[28px] border border-slate-200 bg-white py-2 pl-2 pr-4 shadow-sm focus-within:ring-2 focus-within:ring-pink-200`}
          animate={{ scale: isFocused ? 1.02 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <div className="flex w-full items-center justify-between px-2">
            <input
              type="text"
              name="userSearch"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                if (searchQuery.trim().length >= 2) setOpen(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (!open) setIsFocused(false);
                }, 80);
              }}
              onKeyDown={onKeyDown}
              placeholder="جستجو مشتری با نام، نام خانوادگی یا شماره تلفن..."
              className="text-sm flex-1 bg-transparent text-right text-neutral-600 placeholder-neutral-400 outline-none"
              role="combobox"
              aria-expanded={open}
            />

            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 shadow-sm"
              whileTap={{ scale: 0.95 }}
            >
              <SearchIcon className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full z-[1000] mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white text-neutral-800 shadow-xl"
            >
              {loading && (
                <div className="text-xs px-3 py-2 text-neutral-500">در حال جستجو…</div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="text-xs px-3 py-2 text-neutral-500">مشتری یافت نشد</div>
              )}
              {!loading &&
                suggestions.map((user, idx) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-right hover:bg-slate-50 last:border-b-0 ${
                      activeIndex === idx ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-sm font-semibold text-slate-700">
                        {getUserDisplayName(user).charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {getUserDisplayName(user)}
                        </p>
                        <span className="text-xs text-slate-500">
                          {user.attributes.user_role?.data?.attributes?.Title}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {user.attributes.Phone}
                      </p>
                      {user.attributes.user_wallet?.data?.attributes?.Balance && (
                        <p className="text-xs text-slate-500">
                          موجودی: {formatPrice(user.attributes.user_wallet.data.attributes.Balance)} تومان
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserSearchSection;