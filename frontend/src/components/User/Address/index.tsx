import { useEffect } from "react";
import { useAtom } from "jotai";
import AddressCard from "./AddressCard";
import UserService from "@/services/user";
import AddAddress from "./AddAddress";
import { addressesAtom, addressesLoadingAtom, addressesErrorAtom } from "@/atoms/addressesAtom";

const AddressContainer = () => {
  const [addresses, setAddresses] = useAtom(addressesAtom);
  const [loading, setLoading] = useAtom(addressesLoadingAtom);
  const [error, setError] = useAtom(addressesErrorAtom);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const addresses = await UserService.addresses.getAll();
      setAddresses(addresses);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      setError("خطا در دریافت آدرس‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [setAddresses, setLoading, setError]);

  const handleDelete = async (id: number) => {
    // Optimistic update: remove immediately from UI
    const previousAddresses = addresses;
    setAddresses(addresses.filter(addr => addr.id !== id));

    try {
      await UserService.addresses.delete(id);
      // Success - address is already removed from UI
    } catch (err) {
      console.error("Failed to delete address:", err);
      // Revert on error
      setAddresses(previousAddresses);
      alert("خطا در حذف آدرس");
    }
  };

  const renderAddresses = () => {
    if (loading) {
      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (addresses.length === 0) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">هیچ آدرسی ثبت نشده است. لطفا یک آدرس جدید اضافه کنید.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 lg:gap-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={`${address.FullAddress} - ${address.shipping_city.Title}, ${address.shipping_city.shipping_province.Title}`}
            postalCode={address.PostalCode}
            description={address.Description}
            onEdit={() => {
              /* Will be implemented later */
            }}
            onDelete={() => handleDelete(address.id)}
          />
        ))}
      </div>
    );
  };

  // Callback for when new address is added - refetch to sync with backend
  const handleAddressAdded = async () => {
    await fetchAddresses();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddAddress onAddressAdded={handleAddressAdded} />
      </div>
      {renderAddresses()}
    </div>
  );
};

export default AddressContainer;
