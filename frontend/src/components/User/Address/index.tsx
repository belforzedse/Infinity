import { useEffect, useState } from "react";
import AddressCard from "./AddressCard";
import UserService from "@/services/user";
import { UserAddress } from "@/services/user/addresses";
import AddAddress from "./AddAddress";

const AddressContainer = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await UserService.addresses.delete(id);
      // Refresh address list after deletion
      fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
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
          <p className="text-gray-500">
            هیچ آدرسی ثبت نشده است. لطفا یک آدرس جدید اضافه کنید.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 lg:gap-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            id={address.id}
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddAddress onAddressAdded={fetchAddresses} />
      </div>
      {renderAddresses()}
    </div>
  );
};

export default AddressContainer;
