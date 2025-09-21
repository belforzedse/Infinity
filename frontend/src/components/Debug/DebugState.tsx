"use client";

import React, { useState, useEffect } from "react";

const DebugState: React.FC = () => {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [sessionStorageData, setSessionStorageData] = useState<any>({});
  const [cookiesData, setCookiesData] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState("localStorage");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    const updateStorageData = () => {
      // Local Storage
      const localStorage: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          try {
            const value = window.localStorage.getItem(key);
            localStorage[key] = value ? JSON.parse(value) : value;
          } catch {
            localStorage[key] = window.localStorage.getItem(key);
          }
        }
      }
      setLocalStorageData(localStorage);

      // Session Storage
      const sessionStorage: Record<string, any> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          try {
            const value = window.sessionStorage.getItem(key);
            sessionStorage[key] = value ? JSON.parse(value) : value;
          } catch {
            sessionStorage[key] = window.sessionStorage.getItem(key);
          }
        }
      }
      setSessionStorageData(sessionStorage);

      // Cookies
      const cookies: Record<string, any> = {};
      if (document.cookie) {
        document.cookie.split(";").forEach((cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key) {
            try {
              cookies[key] = decodeURIComponent(value || "");
            } catch {
              cookies[key] = value || "";
            }
          }
        });
      }
      setCookiesData(cookies);
    };

    updateStorageData();
    const interval = setInterval(updateStorageData, 2000);
    return () => clearInterval(interval);
  }, []);

  const deleteItem = (key: string, storage: "localStorage" | "sessionStorage" | "cookies") => {
    switch (storage) {
      case "localStorage":
        window.localStorage.removeItem(key);
        break;
      case "sessionStorage":
        window.sessionStorage.removeItem(key);
        break;
      case "cookies":
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        break;
    }
    console.log(`Deleted ${key} from ${storage}`);
  };

  const addItem = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      switch (selectedTab) {
        case "localStorage":
          window.localStorage.setItem(newKey, newValue);
          break;
        case "sessionStorage":
          window.sessionStorage.setItem(newKey, newValue);
          break;
        case "cookies":
          document.cookie = `${newKey}=${encodeURIComponent(newValue)}; path=/`;
          break;
      }
      setNewKey("");
      setNewValue("");
      console.log(`Added ${newKey} to ${selectedTab}`);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const clearAll = (storage: "localStorage" | "sessionStorage" | "cookies") => {
    switch (storage) {
      case "localStorage":
        window.localStorage.clear();
        break;
      case "sessionStorage":
        window.sessionStorage.clear();
        break;
      case "cookies":
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        break;
    }
    console.log(`Cleared all ${storage}`);
  };

  const exportData = (storage: "localStorage" | "sessionStorage" | "cookies") => {
    let data;
    switch (storage) {
      case "localStorage":
        data = localStorageData;
        break;
      case "sessionStorage":
        data = sessionStorageData;
        break;
      case "cookies":
        data = cookiesData;
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storage}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: any) => {
    if (typeof value === "string") {
      if (value.length > 50) return value.substring(0, 50) + "...";
      return value;
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getCurrentData = () => {
    switch (selectedTab) {
      case "localStorage":
        return localStorageData;
      case "sessionStorage":
        return sessionStorageData;
      case "cookies":
        return cookiesData;
      default:
        return {};
    }
  };

  const currentData = getCurrentData();
  const dataEntries = Object.entries(currentData);

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex space-x-1">
        {["localStorage", "sessionStorage", "cookies"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`text-xs rounded px-2 py-1 transition-colors ${
              selectedTab === tab
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {tab}
            <span className="text-xs ml-1 opacity-75">
              ({Object.keys(getCurrentData()).length})
            </span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex space-x-1">
        <button
          onClick={() => clearAll(selectedTab as any)}
          className="text-xs rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
        >
          Clear All
        </button>
        <button
          onClick={() => exportData(selectedTab as any)}
          className="text-xs rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
        >
          Export
        </button>
      </div>

      {/* Add New Item */}
      <div className="space-y-1">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key..."
          className="text-xs w-full rounded bg-gray-800 px-2 py-1 text-white placeholder-gray-400"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value..."
          className="text-xs w-full rounded bg-gray-800 px-2 py-1 text-white placeholder-gray-400"
        />
        <button
          onClick={addItem}
          className="text-xs w-full rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
        >
          Add Item
        </button>
      </div>

      {/* Data Display */}
      <div className="max-h-40 overflow-y-auto">
        {dataEntries.length === 0 ? (
          <div className="text-xs py-4 text-center text-gray-400">
            No data found in {selectedTab}
          </div>
        ) : (
          <div className="space-y-1">
            {dataEntries.map(([key, value]) => (
              <div key={key} className="text-xs rounded bg-gray-800 p-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 truncate font-semibold text-purple-400">{key}</div>
                    <div className="break-all text-gray-300">{formatValue(value)}</div>
                  </div>
                  <button
                    onClick={() => deleteItem(key, selectedTab as any)}
                    className="ml-2 text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Stats */}
      <div className="text-xs text-gray-400">
        <div className="mb-1 font-semibold">Storage Info:</div>
        <div>localStorage: {Object.keys(localStorageData).length} items</div>
        <div>sessionStorage: {Object.keys(sessionStorageData).length} items</div>
        <div>Cookies: {Object.keys(cookiesData).length} items</div>
      </div>
    </div>
  );
};

export default DebugState;
